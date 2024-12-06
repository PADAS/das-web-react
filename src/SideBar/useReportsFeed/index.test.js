import React from 'react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { setupServer } from 'msw/node';
import { waitFor } from '@testing-library/react';

import { DEFAULT_EVENT_SORT } from '../../constants';
import { events, eventWithPoint } from '../../__test-helpers/fixtures/events';
import { EVENTS_API_URL, EVENT_API_URL } from '../../ducks/events';
import { INITIAL_FILTER_STATE as INITIAL_EVENT_FILTER_STATE } from '../../ducks/event-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import useReportsFeed from '.';

const eventFeedResponse = { data: { results: events, next: null, count: events.length, page: 1 } };

const server = setupServer(
  http.get(EVENTS_API_URL, () => HttpResponse.json(eventFeedResponse)),
  http.get(`${EVENT_API_URL}:id`, () => HttpResponse.json({ data: eventWithPoint })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useReportsFeed', () => {
  let store;

  beforeEach(() => {
    store = {
      data: {
        eventFilter: INITIAL_EVENT_FILTER_STATE,
        feedEvents: {
          results: [],
        },
        eventStore: {},
        user: {
          permissions: {
            '_geographic_distance': {},
          }
        },
      },
      view: {
        userLocation: {
          coords: {
            latitude: '50.3',
            longitude: '65.7',
          }
        }
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns the reportsFetchFeed properties and methods', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    const { result } = renderHook(() => useReportsFeed(), { wrapper });

    const reportsFetchFeed = result.current;

    expect(reportsFetchFeed.events).toEqual({ results: [] });
    expect(reportsFetchFeed.feedSort).toBe(DEFAULT_EVENT_SORT);
    expect(typeof reportsFetchFeed.loadFeedEvents).toBe('function');
    expect(reportsFetchFeed.loadingEventFeed).toBe(true);
    expect(typeof reportsFetchFeed.setFeedSort).toBe('function');
    expect(reportsFetchFeed.shouldExcludeContained).toBe(true);
  });

  test('loads the reports feed for georestricted users', async () => {
    const builtStore = mockStore(store);
    const wrapper = ({ children }) => <Provider store={builtStore}>{children}</Provider>;
    renderHook(() => useReportsFeed(), { wrapper });

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions).toHaveLength(3);
      expect(actions[0].type).toBe('FEED_FETCH_START');
      expect(actions[1].type).toBe('UPDATE_EVENT_STORE');
      expect(actions[2].type).toBe('FEED_FETCH_SUCCESS');
    });
  });

  test('loads the reports feed normally', async () => {
    store.data.user.permissions = [];
    const builtStore = mockStore(store);
    const wrapper = ({ children }) => <Provider store={builtStore}>{children}</Provider>;
    renderHook(() => useReportsFeed(), { wrapper });

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions).toHaveLength(3);
      expect(actions[0].type).toBe('FEED_FETCH_START');
      expect(actions[1].type).toBe('UPDATE_EVENT_STORE');
      expect(actions[2].type).toBe('FEED_FETCH_SUCCESS');
    });
  });
});
