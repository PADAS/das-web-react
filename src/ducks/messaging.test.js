import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { fetchAllMessages, MESSAGING_API_URL } from './messaging';
import { messages } from '../__test-helpers/fixtures/messages';

describe('Ducks - Messaging', () => {
  describe('fetchAllMessages', () => {
    test('Retrieves all messages page by page', async () => {
      const firstPageOfMessages = messages.slice(0, 26);
      const secondPageOfMessages = messages.slice(26, 50);

      const secondPageUrl = 'next-page-url';
      const requestParams = {
        whatever: 666,
        neato: 'hello',
      };

      const server = setupServer(
        http.get(MESSAGING_API_URL, () => HttpResponse.json({
          data: {
            next: secondPageUrl,
            results: firstPageOfMessages,
          },
        })),
        http.get(secondPageUrl, () => HttpResponse.json({
          data: {
            next: null,
            results: secondPageOfMessages,
          },
        })),
      );

      server.listen();

      const results = await fetchAllMessages(requestParams);

      expect(results).toEqual([...firstPageOfMessages, ...secondPageOfMessages]);

      server.resetHandlers();
      server.close();
    });

    test('Parallelizes requests to many subject ids and sorts the results', async () => {
      const sortedMessages = [{
        id: 'message8',
        message_time: '2020-01-01T15:30:00.000000-07:00',
      }, {
        id: 'message7',
        message_time: '2020-01-01T15:00:00.000000-07:00',
      }, {
        id: 'message6',
        message_time: '2020-01-01T14:30:00.000000-07:00',
      }, {
        id: 'message5',
        message_time: '2020-01-01T14:00:00.000000-07:00',
      }, {
        id: 'message4',
        message_time: '2020-01-01T13:30:00.000000-07:00',
      }, {
        id: 'message3',
        message_time: '2020-01-01T13:00:00.000000-07:00',
      }, {
        id: 'message2',
        message_time: '2020-01-01T12:30:00.000000-07:00',
      }, {
        id: 'message1',
        message_time: '2020-01-01T12:00:00.000000-07:00',
      }];
      // Since we are requesting messages from 75 subject ids, we expect to
      // have 3 requests with 25 subject ids each. We return the messages in
      // a random order to test that the function sorts them.
      const requestResults = [
        [sortedMessages[2], sortedMessages[6]],
        [sortedMessages[7], sortedMessages[5], sortedMessages[1]],
        [sortedMessages[3], sortedMessages[4], sortedMessages[0]],
      ];

      // Send the subject_id parameter with 75 subject ids so the method splits
      // the request in 3 chunks.
      const requestParams = {
        subject_id: 'subject1,subject2,subject3,subject4,subject5,subject6,subject7,subject8,subject9,subject10,subject11,subject12,subject13,subject14,subject15,subject16,subject17,subject18,subject19,subject20,subject21,subject22,subject23,subject24,subject25,subject26,subject27,subject28,subject29,subject30,subject31,subject32,subject33,subject34,subject35,subject36,subject37,subject38,subject39,subject40,subject41,subject42,subject43,subject44,subject45,subject46,subject47,subject48,subject49,subject50,subject51,subject52,subject53,subject54,subject55,subject56,subject57,subject58,subject59,subject60,subject61,subject62,subject63,subject64,subject65,subject66,subject67,subject68,subject69,subject70,subject71,subject72,subject73,subject74,subject75',
      };

      let callCount = 0;
      const server = setupServer(
        http.get(MESSAGING_API_URL, () => {
          const results = requestResults[callCount];
          callCount += 1;

          return HttpResponse.json({
            data: {
              next: null,
              results,
            },
          });
        })
      );

      server.listen();

      const results = await fetchAllMessages(requestParams);

      expect(callCount).toBe(3);
      expect(results).toEqual(sortedMessages);

      server.resetHandlers();
      server.close();
    });
  });
});