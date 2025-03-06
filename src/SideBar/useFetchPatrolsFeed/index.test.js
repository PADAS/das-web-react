import React from 'react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { setupServer } from 'msw/node';
import { waitFor } from '@testing-library/react';

import { INITIAL_FILTER_STATE as INITIAL_PATROL_FILTER_STATE } from '../../ducks/patrol-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { PATROLS_API_URL } from '../../ducks/patrols';
import useFetchPatrolsFeed from '.';

const patrolFeedResponse = { data: { results: patrols, next: null, count: patrols.length, page: 1 } };

const server = setupServer(
  http.get(PATROLS_API_URL, () => HttpResponse.json(patrolFeedResponse)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useFetchPatrolsFeed', () => {
  let store;

  beforeEach(() => {
    store = { data: { patrolFilter: INITIAL_PATROL_FILTER_STATE }, view: {} };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns the patrolsFetchFeed properties and methods', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    const { result } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    const patrolsFetchFeed = result.current;

    expect(patrolsFetchFeed.loadingPatrolsFeed).toBe(true);
  });


  test('loads the patrols feed', async () => {
    const builtStore = mockStore(store);
    const wrapper = ({ children }) => <Provider store={builtStore}>{children}</Provider>;
    renderHook(() => useFetchPatrolsFeed(), { wrapper });

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('FETCH_PATROLS_FEED_SUCCESS');
      expect(actions[1].type).toBe('UPDATE_PATROL_STORE');
    });
  });
});
