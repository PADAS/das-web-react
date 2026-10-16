import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';

import { renderHook, waitFor } from '../../test-utils';
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

  const renderUseReportsFeed = (builtStore = mockStore(store)) => renderHook(() => useReportsFeed(), {
    wrapper: ({ children }) => <Provider store={builtStore}>{children}</Provider>,
  });

  test('returns the reportsFetchFeed properties and methods', async () => {
    const { result } = renderUseReportsFeed();

    const reportsFetchFeed = result.current;

    expect(reportsFetchFeed.events).toEqual({ results: [] });
    expect(reportsFetchFeed.feedSort).toBe(DEFAULT_EVENT_SORT);
    expect(typeof reportsFetchFeed.loadFeedEvents).toBe('function');
    expect(reportsFetchFeed.loadingEventFeed).toBe(true);
    expect(reportsFetchFeed.shouldExcludeContained).toBe(true);
  });

  test('returns the same feed until something in it changes', () => {
    const { rerender, result } = renderUseReportsFeed();
    const initialFeed = result.current;

    rerender();

    expect(result.current).toBe(initialFeed);
  });

  test('loads the reports feed for georestricted users', async () => {
    const builtStore = mockStore(store);
    renderUseReportsFeed(builtStore);

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
    renderUseReportsFeed(builtStore);

    const actions = builtStore.getActions();

    await waitFor(() => {
      expect(actions).toHaveLength(3);
      expect(actions[0].type).toBe('FEED_FETCH_START');
      expect(actions[1].type).toBe('UPDATE_EVENT_STORE');
      expect(actions[2].type).toBe('FEED_FETCH_SUCCESS');
    });
  });

  test('warns and stops loading when the event feed request fails', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(EVENTS_API_URL, () => new HttpResponse(null, { status: 500 })));

    const { result } = renderUseReportsFeed();

    await waitFor(() => {
      expect(result.current.loadingEventFeed).toBe(false);
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to fetch the event feed', expect.any(Error));
  });

  test('does not warn when a newer event feed request cancels the pending one', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let releaseFirstRequest;
    const firstRequestGate = new Promise((resolve) => {
      releaseFirstRequest = resolve;
    });
    let requestCount = 0;
    server.use(http.get(EVENTS_API_URL, async () => {
      requestCount += 1;
      if (requestCount === 1) {
        await firstRequestGate;
      }

      return HttpResponse.json(eventFeedResponse);
    }));
    const builtStore = mockStore(store);

    const { result } = renderUseReportsFeed(builtStore);
    await waitFor(() => {
      expect(requestCount).toBe(1);
    });
    result.current.loadFeedEvents();

    await waitFor(() => {
      expect(builtStore.getActions().map((action) => action.type)).toContain('FEED_FETCH_SUCCESS');
    });
    releaseFirstRequest();

    expect(builtStore.getActions().map((action) => action.type)).toContain('FEED_FETCH_ERROR');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
