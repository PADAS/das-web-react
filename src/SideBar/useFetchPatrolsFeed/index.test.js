import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { waitFor } from '@testing-library/react';

import { INITIAL_FILTER_STATE as INITIAL_PATROL_FILTER_STATE } from '../../ducks/patrol-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { PATROLS_API_URL } from '../../ducks/patrols';
import useFetchPatrolsFeed from '.';

const patrolFeedResponse = { data: { results: patrols, next: null, count: patrols.length, page: 1 } };

const server = setupServer(
  rest.get(PATROLS_API_URL, (req, res, ctx) => res(ctx.json(patrolFeedResponse))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useFetchPatrolsFeed', () => {
  let capturedRequestURLs, store;

  const logRequest = (req) => {
    capturedRequestURLs = [...capturedRequestURLs, req.url.toString()];
  };

  beforeEach(() => {
    capturedRequestURLs = [];
    store = { data: { patrolFilter: INITIAL_PATROL_FILTER_STATE }, view: {} };
  });

  server.events.on('request:match', (req) => {
    logRequest(req);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    server.events.removeListener('request:match', logRequest);
  });

  test('returns the patrolsFetchFeed properties and methods', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    const { result } = renderHook(() => useFetchPatrolsFeed(), { wrapper });

    const patrolsFetchFeed = result.current;

    expect(patrolsFetchFeed.loadingPatrolsFeed).toBe(true);
  });


  test('loads the patrols feed', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    renderHook(() => useFetchPatrolsFeed(), { wrapper });

    await waitFor(() => {
      expect(capturedRequestURLs.find(item => item.includes(PATROLS_API_URL))).toBeDefined();
    });
  });
});
