import axios from 'axios';

import parallelPaginatedRequest from './';
import { EVENTS_API_URL } from '../events';

describe('parallelPaginatedRequest', () => {


  test('handles all promises properly', async () => {
    const itemsPerPage = 150;

    const results = Array.from({
      length: itemsPerPage
    },
    (_, i) => i
    );

    axios.get = jest.fn(() => {
      return Promise.resolve({
        status: 200,
        data: {
          data: {
            results,
            count: 200,
          }
        }
      });
    });

    const onPageFetch = jest.fn();
    const expectedPages = 2;

    const allItems = await parallelPaginatedRequest(EVENTS_API_URL, {}, {
      itemsPerPage,
      onPageFetch
    });

    expect(onPageFetch).toHaveBeenCalledTimes(expectedPages);
    expect(onPageFetch).toHaveBeenCalledWith({
      count: 200,
      results
    });
    expect(allItems.length).toBe(results.length * expectedPages);
  });

  test('throws error if first page can not be resolved', async () => {
    axios.get = jest.fn(() => {
      return Promise.resolve({
        status: 404
      });
    });

    try {
      await parallelPaginatedRequest(EVENTS_API_URL);
    } catch (e){
      console.log(e.message);
      expect(e.message).toBe('Failed to fetch the first page. Aborting.');
    }
  });

});
