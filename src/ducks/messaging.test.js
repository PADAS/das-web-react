import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { messages } from '../__test-helpers/fixtures/messages';

import { MESSAGING_API_URL, fetchAllMessages } from './messaging';

const firstPageOfMessages = messages.slice(0, 26);
const secondPageOfMessages = messages.slice(26, 50);

describe('#fetchAllMessages', () => {
  test('paginating, with parameters, to retrieve all messages from the messaging API', async () => {
    const secondPageUrl = 'next-page-url';
    const requestParams = {
      whatever: 666,
      neato: 'hello',
    };

    const server = setupServer(
      rest.get(MESSAGING_API_URL, (req, res, ctx) => {
        const { url } = req;

        Object.entries(requestParams).forEach(([key, val]) => {
          expect(url.search.includes(`${key}=${val}`)).toBeTruthy();
        });

        const data = {
          results: firstPageOfMessages,
          next: secondPageUrl,
        };

        return res(ctx.json( { data }));
      }),
      rest.get(secondPageUrl, (req, res, ctx) => {
        const data = {
          results: secondPageOfMessages,
          next: null,
        };

        return res(ctx.json( { data }));
      })
    );

    server.listen();

    const results = await fetchAllMessages(requestParams);
    expect(results).toEqual([...firstPageOfMessages, ...secondPageOfMessages]);

    server.resetHandlers();
    server.close();
  });
});