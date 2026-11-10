import { act } from 'react';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { CanceledError } from 'axios';
import { Provider } from 'react-redux';
import { thunk } from 'redux-thunk';

import feedTableSortReducer from '../../ducks/feed-table-sort';
import { renderHook, waitFor } from '../../test-utils';
import { TAB_KEYS } from '../../constants';

import useFeedTableFullLoad, { FULL_LOAD_RETRY_DELAY } from './';

const FIRST_PAGE_URL = 'https://das/events?use_cursor=true';
const SECOND_PAGE_URL = 'https://das/events?cursor=2';

const EVENT_STORE = {
  'event-1': { id: 'event-1' },
  'event-2': { id: 'event-2' },
  'event-3': { id: 'event-3' },
};

const page = (ids, next = null) => ({ next, results: ids.map((id) => ({ id })) });

describe('FeedTable - useFeedTableFullLoad', () => {
  let fetchPage, pagesByUrl, store;

  beforeEach(() => {
    pagesByUrl = {
      [FIRST_PAGE_URL]: () => Promise.resolve(page(['event-1', 'event-2'], SECOND_PAGE_URL)),
      [SECOND_PAGE_URL]: () => Promise.resolve(page(['event-3'])),
    };
    fetchPage = jest.fn((url) => () => pagesByUrl[url]());
    store = createStore(
      combineReducers({
        data: () => ({ eventStore: EVENT_STORE }),
        view: combineReducers({ feedTableSort: feedTableSortReducer }),
      }),
      applyMiddleware(thunk)
    );
  });

  const renderUseFeedTableFullLoad = (props = {}) => renderHook(
    (hookProps) => useFeedTableFullLoad({
      fetchPage,
      firstPageUrl: FIRST_PAGE_URL,
      hasMorePages: true,
      isEnabled: true,
      loadId: 1,
      rows: [EVENT_STORE['event-1']],
      selectStore: (state) => state.data.eventStore,
      tab: TAB_KEYS.EVENTS,
      ...hookProps,
    }),
    {
      initialProps: props,
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    }
  );

  const shownIds = (result) => result.current.rows.map((row) => row.id);

  test('loads every page apart from the feed and adds the rows the feed lacks', async () => {
    const { result } = renderUseFeedTableFullLoad();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchPage.mock.calls.map((call) => call[0])).toEqual([FIRST_PAGE_URL, SECOND_PAGE_URL]);
    expect(shownIds(result)).toEqual(['event-1', 'event-2', 'event-3']);
  });

  test('loads nothing while disabled', async () => {
    const { result } = renderUseFeedTableFullLoad({ isEnabled: false });

    await act(async () => {});

    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(shownIds(result)).toEqual(['event-1']);
  });

  test('loads nothing when the feed already lists every row', async () => {
    renderUseFeedTableFullLoad({ hasMorePages: false });

    await act(async () => {});

    expect(fetchPage).not.toHaveBeenCalled();
  });

  test('keeps the loaded rows when it remounts', async () => {
    const { result, unmount } = renderUseFeedTableFullLoad();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    unmount();

    const { result: remountedResult } = renderUseFeedTableFullLoad();
    await act(async () => {});

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(shownIds(remountedResult)).toEqual(['event-1', 'event-2', 'event-3']);
  });

  test('loads again when the feed is refreshed, showing the old rows until it is done', async () => {
    const { rerender, result } = renderUseFeedTableFullLoad();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let resolveFirstPage;
    pagesByUrl[FIRST_PAGE_URL] = () => new Promise((resolve) => {
      resolveFirstPage = resolve;
    });
    rerender({ loadId: 2 });

    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(3));
    expect(result.current.isLoading).toBe(true);
    expect(shownIds(result)).toEqual(['event-1', 'event-2', 'event-3']);

    await act(async () => resolveFirstPage(page(['event-2'])));

    expect(result.current.isLoading).toBe(false);
    expect(shownIds(result)).toEqual(['event-1', 'event-2']);
  });

  test('starts over with no rows of the old filter when the filter changes', async () => {
    const { rerender, result } = renderUseFeedTableFullLoad();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    pagesByUrl['https://das/events?state=active'] = () => new Promise(() => {});
    rerender({ firstPageUrl: 'https://das/events?state=active' });

    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(3));
    expect(shownIds(result)).toEqual(['event-1']);
  });

  describe('when a page fails', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      pagesByUrl[FIRST_PAGE_URL] = jest.fn(() => Promise.reject(new Error('offline')));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const advanceTimers = (delay) => act(async () => jest.advanceTimersByTime(delay));

    test('retries it after 2, 4 and 8 seconds, then pauses until retried', async () => {
      const { result } = renderUseFeedTableFullLoad();
      await advanceTimers(0);

      for (const delay of [1, 2, 4]) {
        expect(result.current.isPaused).toBe(false);
        await advanceTimers(FULL_LOAD_RETRY_DELAY * delay);
      }

      expect(fetchPage).toHaveBeenCalledTimes(4);
      expect(result.current.isPaused).toBe(true);
      expect(result.current.isLoading).toBe(false);

      await advanceTimers(FULL_LOAD_RETRY_DELAY * 8);
      expect(fetchPage).toHaveBeenCalledTimes(4);

      await act(async () => result.current.retry());
      await advanceTimers(0);

      expect(fetchPage).toHaveBeenCalledTimes(5);
    });

    test('neither retries nor pauses for a cancelled page', async () => {
      pagesByUrl[FIRST_PAGE_URL] = jest.fn(() => Promise.reject(new CanceledError()));
      const { result } = renderUseFeedTableFullLoad();
      await advanceTimers(0);

      await advanceTimers(FULL_LOAD_RETRY_DELAY * 15);

      expect(fetchPage).toHaveBeenCalledTimes(1);
      expect(result.current.isPaused).toBe(false);
    });

    test('starts over without the failures of the old load when the feed is refreshed', async () => {
      const { rerender, result } = renderUseFeedTableFullLoad();
      await advanceTimers(0);
      for (const delay of [1, 2, 4]) {
        await advanceTimers(FULL_LOAD_RETRY_DELAY * delay);
      }
      expect(result.current.isPaused).toBe(true);

      rerender({ loadId: 2 });
      await advanceTimers(0);

      expect(result.current.isPaused).toBe(false);
      expect(fetchPage).toHaveBeenCalledTimes(5);
    });
  });
});
