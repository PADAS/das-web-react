import React from 'react';
import { CancelToken } from 'axios';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';

import { INITIAL_FILTER_STATE as INITIAL_PATROL_FILTER_STATE } from '../../ducks/patrol-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { PATROLS_API_URL } from '../../ducks/patrols';
import { renderHook, waitFor } from '../../test-utils';
import useFetchPatrolsFeed from '.';

const server = setupServer(
  http.get(PATROLS_API_URL, () => HttpResponse.json({
    data: {
      count: patrols.length,
      page: 1,
      next: null,
      results: patrols,
    },
  })),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

describe('SideBar - useFetchPatrolsFeed', () => {
  let store, builtStore;

  const wrapper = ({ children }) => <Provider store={builtStore}>{children}</Provider>;

  const changePatrolFilterText = (text) => {
    builtStore = mockStore({
      ...store,
      data: {
        ...store.data,
        patrolFilter: {
          ...store.data.patrolFilter,
          filter: { ...store.data.patrolFilter.filter, text },
        },
      },
    });
  };

  beforeEach(() => {
    store = {
      data: {
        patrolFilter: INITIAL_PATROL_FILTER_STATE,
        patrolsFeed: [],
      },
      view: {},
    };
    builtStore = mockStore(store);
  });

  test('fetches the patrols feed when the component mounts', async () => {
    const { result } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    expect(result.current.loadingPatrolsFeed).toBe(true);

    await waitFor(() => {
      const actions = builtStore.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('UPDATE_PATROL_STORE');
      expect(actions[1].type).toBe('FETCH_PATROLS_FEED_SUCCESS');
    });

    expect(result.current.loadingPatrolsFeed).toBe(false);
  });

  test('refreshes the feed behind the patrols it already lists, without a loading state', async () => {
    store.data.patrolsFeed = [patrols[0].id];

    const { result } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    expect(result.current.loadingPatrolsFeed).toBe(false);

    await waitFor(() => {
      expect(builtStore.getActions()).toContainEqual(
        expect.objectContaining({ type: 'FETCH_PATROLS_FEED_SUCCESS' })
      );
    });

    expect(result.current.loadingPatrolsFeed).toBe(false);
  });

  test('waits for the new results when the patrol filter changes', async () => {
    store.data.patrolsFeed = [patrols[0].id];

    const { rerender, result } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    changePatrolFilterText('lion');
    rerender();

    expect(result.current.loadingPatrolsFeed).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingPatrolsFeed).toBe(false);
    });
  });

  test('fetches the patrols feed again if the patrol filter changes', async () => {
    const { rerender } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    await waitFor(() => {
      expect(builtStore.getActions()).toContainEqual(expect.objectContaining({ type: 'FETCH_PATROLS_FEED_SUCCESS' }));
    });

    changePatrolFilterText('lion');
    rerender();

    await waitFor(() => {
      expect(builtStore.getActions()).toContainEqual(expect.objectContaining({ type: 'FETCH_PATROLS_FEED_SUCCESS' }));
    });
  });

  test('cancels the first fetch if a new fetch is initiated', async () => {
    const cancelFns = [];
    const realSource = CancelToken.source;
    jest.spyOn(CancelToken, 'source').mockImplementation(() => {
      const source = realSource();
      cancelFns.push(jest.spyOn(source, 'cancel'));
      return source;
    });

    const { rerender } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    expect(cancelFns).toHaveLength(1);

    changePatrolFilterText('lion');
    rerender();

    expect(cancelFns).toHaveLength(2);
    expect(cancelFns[0]).toHaveBeenCalledTimes(1);
    expect(cancelFns[1]).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(builtStore.getActions()).toContainEqual(expect.objectContaining({ type: 'FETCH_PATROLS_FEED_SUCCESS' }));
    });
  });

  test('cancels a fetch if the component unmounts', () => {
    const cancelFns = [];
    const realSource = CancelToken.source;
    jest.spyOn(CancelToken, 'source').mockImplementation(() => {
      const source = realSource();
      cancelFns.push(jest.spyOn(source, 'cancel'));
      return source;
    });

    const { unmount } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    expect(cancelFns[0]).not.toHaveBeenCalled();

    unmount();

    expect(cancelFns[0]).toHaveBeenCalledTimes(1);
  });
});
