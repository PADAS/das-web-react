import { http, HttpResponse } from 'msw';
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
      http.get(MESSAGING_API_URL, ({ request }) => {
        const { url: requestUrl } = request;

        const url = new URL(requestUrl);
        Object.entries(requestParams).forEach(([key, val]) => {
          expect(url.search.includes(`${key}=${val}`)).toBeTruthy();
        });

        const data = {
          results: firstPageOfMessages,
          next: secondPageUrl,
        };

        return HttpResponse.json({ data });
      }),
      http.get(secondPageUrl, () => {
        const data = {
          results: secondPageOfMessages,
          next: null,
        };

        return HttpResponse.json({ data });
      })
    );

    server.listen();

    const results = await fetchAllMessages(requestParams);
    expect(results).toEqual([...firstPageOfMessages, ...secondPageOfMessages]);

    server.resetHandlers();
    server.close();
  });
});