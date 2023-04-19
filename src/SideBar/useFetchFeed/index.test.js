import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { waitFor } from '@testing-library/react';

import { DEFAULT_EVENT_SORT } from '../../utils/event-filter';
import { events, eventWithPoint } from '../../__test-helpers/fixtures/events';
import { EVENTS_API_URL, EVENT_API_URL } from '../../ducks/events';
import { INITIAL_FILTER_STATE as INITIAL_EVENT_FILTER_STATE } from '../../ducks/event-filter';
import { INITIAL_FILTER_STATE as INITIAL_PATROL_FILTER_STATE } from '../../ducks/patrol-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { PATROLS_API_URL } from '../../ducks/patrols';
import useFetchReportsFeed from '.';

const eventFeedResponse = { data: { results: events, next: null, count: events.length, page: 1 } };
const patrolFeedResponse = { data: { results: patrols, next: null, count: patrols.length, page: 1 } };

const server = setupServer(
  rest.get(EVENTS_API_URL, (req, res, ctx) => res(ctx.json(eventFeedResponse))),
  rest.get(`${EVENT_API_URL}:id`, (req, res, ctx) => res(ctx.json({ data: eventWithPoint }))),
  rest.get(PATROLS_API_URL, (req, res, ctx) => res(ctx.json(patrolFeedResponse))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useFetchReportsFeed', () => {
  let capturedRequestURLs, store;

  const logRequest = (req) => {
    capturedRequestURLs = [...capturedRequestURLs, req.url.toString()];
  };

  beforeEach(() => {
    capturedRequestURLs = [];
    store = {
      data: {
        eventFilter: INITIAL_EVENT_FILTER_STATE,
        feedEvents: {
          results: [],
        },
        eventStore: {},
        patrolFilter: INITIAL_PATROL_FILTER_STATE,
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

  server.events.on('request:match', (req) => {
    logRequest(req);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    server.events.removeListener('request:match', logRequest);
  });

  test('returns the reportsFetchFeed properties and methods', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    const { result } = renderHook(() => useFetchReportsFeed(), { wrapper });

    const { reportsFetchFeed } = result.current;

    expect(reportsFetchFeed.feedSort).toBe(DEFAULT_EVENT_SORT);
    expect(typeof reportsFetchFeed.loadFeedEvents).toBe('function');
    expect(reportsFetchFeed.loadingEventFeed).toBe(true);
    expect(typeof reportsFetchFeed.setFeedSort).toBe('function');
    expect(reportsFetchFeed.shouldExcludeContained).toBe(true);
  });

  test('loads the reports feed for georestricted users', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    renderHook(() => useFetchReportsFeed(), { wrapper });

    await waitFor(() => {
      expect(capturedRequestURLs.find(item => item.includes(EVENTS_API_URL))).toContain('location=65.7%2C50.3');
    });
  });

  test('loads the reports feed normally', async () => {
    store.data.user.permissions = [];
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    renderHook(() => useFetchReportsFeed(), { wrapper });

    await waitFor(() => {
      expect(capturedRequestURLs.find(item => item.includes(EVENTS_API_URL))).toBeDefined();
      expect(capturedRequestURLs.find(item => item.includes(EVENTS_API_URL))).not.toContain('location');
    });
  });

  test('returns the patrolsFetchFeed properties and methods', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    const { result } = renderHook(() => useFetchReportsFeed(), { wrapper });

    const { patrolsFetchFeed } = result.current;

    expect(patrolsFetchFeed.loadingPatrolsFeed).toBe(true);
  });


  test('loads the patrols feed', async () => {
    const wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;
    renderHook(() => useFetchReportsFeed(), { wrapper });

    await waitFor(() => {
      expect(capturedRequestURLs.find(item => item.includes(PATROLS_API_URL))).toBeDefined();
    });
  });
});
