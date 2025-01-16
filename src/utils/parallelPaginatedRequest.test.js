import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import parallelPaginatedRequest from './parallelPaginatedRequest';
import { EVENTS_API_URL } from '../ducks/events';


const calculateMockResponseResults = (itemsPerPage) => {
  return Array.from({
    length: itemsPerPage
  },
  (_, i) => i
  );
};

const server = setupServer(
  http.get(EVENTS_API_URL, () => {
    return HttpResponse.json({
      status: 200,
      data: {
        results: calculateMockResponseResults(150),
        count: 200,
      }
    });
  }),
);

describe('parallelPaginatedRequest', () => {

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('handles all promises properly', async () => {
    const onPageFetch = jest.fn();
    const expectedPages = 2;

    const allItems = await parallelPaginatedRequest(`${EVENTS_API_URL}?`, {}, {
      itemsPerPage: 150,
      onPageFetch
    });

    const results = calculateMockResponseResults(150);

    expect(onPageFetch).toHaveBeenCalledTimes(expectedPages);
    expect(onPageFetch).toHaveBeenCalledWith({
      count: 200,
      results
    });
    expect(allItems.length).toBe(results.length * expectedPages);
  });

  test('handle proper amount of pages with its callback respectively ', async () => {
    const onPageFetch = jest.fn();
    const expectedPages = 4;

    const results = calculateMockResponseResults(300);

    server.use(
      http.get(EVENTS_API_URL, () => {
        return HttpResponse.json({
          status: 200,
          data: {
            results,
            count: 1200,
          }
        });
      })
    );

    const allItems = await parallelPaginatedRequest(`${EVENTS_API_URL}?`, {}, {
      itemsPerPage: 300,
      onPageFetch
    });

    expect(onPageFetch).toHaveBeenCalledTimes(expectedPages);
    expect(onPageFetch).toHaveBeenCalledWith({
      count: 1200,
      results
    });
    expect(allItems.length).toBe(results.length * expectedPages);
  });

  test('throws error if first page can not be resolved', async () => {
    try {
      await parallelPaginatedRequest(`${EVENTS_API_URL}/notAPage?`);
    } catch (e){
      expect(e.message).toBe('Failed to fetch the first page. Aborting.');
    }
  });

});
