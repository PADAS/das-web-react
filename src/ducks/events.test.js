import axios from 'axios';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import {
  ADD_EVENT_TO_FEEDS,
  addEventToIncident,
  addEventToPatrol,
  addNoteToEvent,
  COMMUNITY_EVENT_FILES_URL,
  COMMUNITY_EVENT_NOTES_URL,
  COMMUNITY_EVENTS_API_URL,
  createEvent,
  EVENT_API_URL,
  EVENT_FEED_NAME,
  EVENT_RELATIONSHIPS_API_URL,
  eventFeedReducer,
  EVENTS_API_URL,
  eventStoreReducer,
  FEED_FETCH_ERROR,
  FEED_FETCH_NEXT_PAGE_SUCCESS,
  FEED_FETCH_SUCCESS,
  fetchEventFeed,
  fetchIncidentLinkTargets,
  fetchMapEvents,
  fetchNextEventFeedPage,
  fetchRecentEventsIntoRealtimeOverlay,
  INCIDENT_EVENT_API_URL,
  INITIAL_EVENT_FEED_STATE,
  PATROL_EVENT_API_URL,
  REMOVE_EVENT_BY_ID,
  removeEventFromIncident,
  removeEventFromPatrol,
  SOCKET_EVENT_DATA,
  socketEventData,
  socketUpdatePatrolEventLinks,
  UPDATE_EVENT_PATROL_LINKS,
  UPDATE_EVENT_STORE,
  updateEvent,
  uploadEventFile,
} from './events';
import { ADD_EVENT, addRealtimeOverlayEvent, REMOVE_EVENT, removeRealtimeOverlayEvent } from './events-realtime-overlay';
import { PATROLS_API_URL, UPDATE_PATROL_SUCCESS } from './patrols';
import { PREVIEW_FEATURES } from '../constants';
import { validateReportAgainstCurrentEventFilter } from '../utils/events';

jest.mock('../utils/events', () => ({
  ...jest.requireActual('../utils/events'),
  validateReportAgainstCurrentEventFilter: jest.fn(() => true),
}));

describe('eventStoreReducer', () => {
  const details = { species: 'elephant' };

  let eventStore;
  let patrol;

  beforeEach(() => {
    eventStore = {
      'linked-event-id': {
        id: 'linked-event-id',
        patrol_segments: ['other-patrol-segment-id', 'first-patrol-segment-id'],
        patrols: ['other-patrol-id', 'patrol-id'],
      },
      'unlinked-event-id': { id: 'unlinked-event-id', patrol_segments: [], patrols: [] },
    };
    patrol = {
      id: 'patrol-id',
      patrol_segments: [
        { events: [{ id: 'linked-event-id' }], id: 'first-patrol-segment-id' },
        { events: [], id: 'second-patrol-segment-id' },
      ],
    };
  });

  const reducePatrolPush = (shouldUnlinkUnlistedEvents = true) => eventStoreReducer(eventStore, {
    payload: { patrol, shouldUnlinkUnlistedEvents },
    type: UPDATE_EVENT_PATROL_LINKS,
  });

  test('links a stored event to the patrol a push links it to', () => {
    patrol.patrol_segments[1].events = [{ id: 'unlinked-event-id' }];

    expect(reducePatrolPush()['unlinked-event-id']).toEqual({
      id: 'unlinked-event-id',
      patrol_segments: ['second-patrol-segment-id'],
      patrols: ['patrol-id'],
    });
  });

  test('unlinks a stored event from the patrol a push no longer links it to, keeping its other patrols', () => {
    patrol.patrol_segments[0].events = [];

    expect(reducePatrolPush()['linked-event-id']).toEqual({
      id: 'linked-event-id',
      patrol_segments: ['other-patrol-segment-id'],
      patrols: ['other-patrol-id'],
    });
  });

  test('moves a stored event to the legs of the patrol a push links it to', () => {
    patrol.patrol_segments[0].events = [];
    patrol.patrol_segments[1].events = [{ id: 'linked-event-id' }];

    expect(reducePatrolPush()['linked-event-id']).toEqual({
      id: 'linked-event-id',
      patrol_segments: ['other-patrol-segment-id', 'second-patrol-segment-id'],
      patrols: ['other-patrol-id', 'patrol-id'],
    });
  });

  test('keeps the store when a push changes no stored event\'s links', () => {
    patrol.patrol_segments[1].events = [{ id: 'unstored-event-id' }];

    expect(reducePatrolPush()).toBe(eventStore);
  });

  test('keeps the store when a push leaves out the events of a leg', () => {
    delete patrol.patrol_segments[0].events;

    expect(reducePatrolPush()).toBe(eventStore);
  });

  test('keeps the store when a push leaves out the legs of the patrol', () => {
    delete patrol.patrol_segments;

    expect(reducePatrolPush()).toBe(eventStore);
  });

  test('keeps stored events linked when the push may leave out some of them, but links the ones it lists', () => {
    patrol.patrol_segments[0].events = [];
    patrol.patrol_segments[1].events = [{ id: 'unlinked-event-id' }];

    const nextEventStore = reducePatrolPush(false);

    expect(nextEventStore['linked-event-id']).toBe(eventStore['linked-event-id']);
    expect(nextEventStore['unlinked-event-id']).toEqual({
      id: 'unlinked-event-id',
      patrol_segments: ['second-patrol-segment-id'],
      patrols: ['patrol-id'],
    });
  });

  test('keeps loaded event details when a fetch that skips them answers null', () => {
    const state = { e1: { event_details: details, id: 'e1', title: 'Old' } };

    const nextState = eventStoreReducer(state, {
      payload: [{ event_details: null, id: 'e1', title: 'New' }],
      type: UPDATE_EVENT_STORE,
    });

    expect(nextState.e1).toEqual({ event_details: details, id: 'e1', title: 'New' });
  });

  test('takes newer event details', () => {
    const state = { e1: { event_details: details, id: 'e1' } };

    const nextState = eventStoreReducer(state, {
      payload: [{ event_details: { species: 'lion' }, id: 'e1' }],
      type: UPDATE_EVENT_STORE,
    });

    expect(nextState.e1.event_details).toEqual({ species: 'lion' });
  });
});

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchMapEvents', () => {
  let map, store;

  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ data: { }, view: { } });
  });

  test('appending a bbox parameter from the map object', async () => {
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve({
      status: 200,
      data: {
        data: {
          results: [],
          count: 10,
        }
      }
    }));

    await store.dispatch(fetchMapEvents(map));

    expect(axios.get).toHaveBeenCalledTimes(1);


    expect(axios.get.mock.calls[0][0].includes('bbox')).toBeTruthy();

  });

  test('appending a bbox parameter from state if the map object is unavailable', async () => {
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve({
      status: 200,
      data: {
        data: {
          results: [],
          count: 10,
        }
      }
    }));

    store = mockStore({ data: { mapEvents: { bbox: '1,2,3,4' } }, view: { } });

    await store.dispatch(fetchMapEvents(map));

    expect(axios.get).toHaveBeenCalledTimes(1);

    expect(axios.get.mock.calls[0][0].includes('bbox')).toBeTruthy();

  });
  test('rejecting the request if no bbox data is available', async () => {
    await expect(store.dispatch(fetchMapEvents())).rejects.toEqual('no map available');
  });
  test('appending parameters when passed', async () => {
    store = mockStore({ data: { mapEvents: { bbox: '1,2,3,4' } }, view: { userLocation: { coords: { longitude: 1, latitude: 2 } }, systemConfig: { geoPermissionsEnabled: true } } });

    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve({
      status: 200,
      data: {
        data: {
          results: [],
          count: 10,
        }
      }
    }));

    const PARAM_NAME = 'location';

    await store.dispatch(fetchMapEvents(map, { [PARAM_NAME]: 'latitude=whatever,longitude=neato' }));

    expect(axios.get).toHaveBeenCalledTimes(1);

    expect(axios.get.mock.calls[0][0].includes(PARAM_NAME)).toBeTruthy();
  });
});

describe('fetchEventFeed', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('leaves out the open event that reached the store while the feed was loading', async () => {
    window.history.pushState({}, '', '/events/open-event');

    let eventStore = {};
    const store = mockStore(() => ({ data: { eventStore }, view: {} }));

    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      eventStore = { 'open-event': { event_details: {}, id: 'open-event' } };

      return Promise.resolve({ data: { data: { results: [{ id: 'open-event' }, { id: 'other-event' }] } } });
    });

    await store.dispatch(fetchEventFeed({}, ''));

    expect(store.getActions().find((action) => action.type === UPDATE_EVENT_STORE).payload)
      .toEqual([{ id: 'other-event' }]);
  });
});

describe('fetchNextEventFeedPage', () => {
  const NEXT_PAGE_URL = `${EVENTS_API_URL}?page=2`;

  let store;

  beforeEach(() => {
    store = mockStore({ data: { eventStore: {} }, view: {} });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('leaves the feed error alone when the page fails to load', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Network error'));

    await expect(store.dispatch(fetchNextEventFeedPage(NEXT_PAGE_URL))).rejects.toThrow('Network error');

    expect(store.getActions()).not.toContainEqual(expect.objectContaining({ type: FEED_FETCH_ERROR }));
  });

  test('does not cancel a feed refresh that is still loading', async () => {
    const cancelTokens = [];
    jest.spyOn(axios, 'get').mockImplementation((url, config) => {
      cancelTokens.push(config.cancelToken);
      return new Promise(() => {});
    });

    store.dispatch(fetchEventFeed({}, ''));
    store.dispatch(fetchNextEventFeedPage(NEXT_PAGE_URL));

    expect(cancelTokens[0].reason).toBeUndefined();
  });

  test('is cancelled by a feed refresh', async () => {
    const cancelTokens = [];
    jest.spyOn(axios, 'get').mockImplementation((url, config) => {
      cancelTokens.push(config.cancelToken);
      return new Promise(() => {});
    });

    store.dispatch(fetchNextEventFeedPage(NEXT_PAGE_URL));
    store.dispatch(fetchEventFeed({}, ''));

    expect(cancelTokens[0].reason).toBeDefined();
  });
});

describe('fetchRecentEventsIntoRealtimeOverlay', () => {
  let map, store;

  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ data: { eventStore: {} }, view: {} });
  });

  test('resolves without fetching when there is no map', async () => {
    jest.spyOn(axios, 'get');

    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay());

    expect(axios.get).not.toHaveBeenCalled();
  });

  test('queries the recent window within the viewport and seeds eventStore + overlay membership', async () => {
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve({
      status: 200,
      data: { data: { results: [{ id: 'evt-1' }, { id: 'evt-2' }], count: 2 } },
    }));

    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay(map));

    const requestedUrl = axios.get.mock.calls[0][0];
    expect(requestedUrl).toContain('bbox');
    expect(requestedUrl).toContain('updated_since');

    const actions = store.getActions();
    expect(actions).toContainEqual(expect.objectContaining({ type: UPDATE_EVENT_STORE }));
    expect(actions).toContainEqual(expect.objectContaining({ type: ADD_EVENT, payload: expect.objectContaining({ id: 'evt-1' }) }));
    expect(actions).toContainEqual(expect.objectContaining({ type: ADD_EVENT, payload: expect.objectContaining({ id: 'evt-2' }) }));
  });

  test('hides recent events whose state no longer matches the filter, and seeds the rest', async () => {
    store = mockStore({ data: { eventStore: {}, eventFilter: { state: ['active', 'new'] } }, view: {} });
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve({
      status: 200,
      data: { data: { results: [{ id: 'active-1', state: 'active' }, { id: 'resolved-1', state: 'resolved' }], count: 2 } },
    }));

    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay(map));

    const actions = store.getActions();
    expect(actions).toContainEqual(expect.objectContaining({ type: ADD_EVENT, payload: expect.objectContaining({ id: 'active-1' }) }));
    expect(actions).toContainEqual({ type: REMOVE_EVENT, payload: 'resolved-1' });
    expect(actions).not.toContainEqual(expect.objectContaining({ type: ADD_EVENT, payload: expect.objectContaining({ id: 'resolved-1' }) }));
  });

  test('does not seed anything when the recent window is empty', async () => {
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve({
      status: 200,
      data: { data: { results: [], count: 0 } },
    }));

    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay(map));

    const actions = store.getActions();
    expect(actions.some((action) => action.type === UPDATE_EVENT_STORE)).toBe(false);
    expect(actions.some((action) => action.type === ADD_EVENT)).toBe(false);
  });

  test('attaches a cancel token to the request', async () => {
    let requestConfig;
    jest.spyOn(axios, 'get').mockImplementation((_url, config) => {
      requestConfig = config;
      return Promise.resolve({ status: 200, data: { data: { results: [], count: 0 } } });
    });

    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay(map));

    expect(requestConfig?.cancelToken).toBeDefined();
  });

  test('cancels the previous in-flight fetch when called again (prevents stale out-of-viewport pins)', async () => {
    const configs = [];
    jest.spyOn(axios, 'get').mockImplementation((_url, config) => {
      configs.push(config);
      return Promise.resolve({ status: 200, data: { data: { results: [], count: 0 } } });
    });

    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay(map));
    await store.dispatch(fetchRecentEventsIntoRealtimeOverlay(map));

    // The first request's token was cancelled by the second dispatch; the second's was not.
    expect(configs[0].cancelToken.reason).toBeDefined();
    expect(configs[1].cancelToken.reason).toBeUndefined();
  });
});

describe('community-capable write actions', () => {
  let store;

  const COMMUNITY = 'my-community';
  const EVENT = { id: 'event-1', title: 'test' };
  const NOTE = { text: 'a note' };
  const FILE = new File(['contents'], 'file.txt', { type: 'text/plain' });

  const mockPostResolved = () => jest.spyOn(axios, 'post')
    .mockResolvedValue({ status: 201, data: { data: {} } });

  beforeEach(() => {
    store = mockStore({ data: { }, view: { } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createEvent', () => {
    test('posts to EVENTS_API_URL without skipAuth when no community is provided', async () => {
      mockPostResolved();

      await store.dispatch(createEvent(EVENT));

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = axios.post.mock.calls[0];
      expect(url).toBe(EVENTS_API_URL);
      expect(body).toBe(EVENT);
      expect(config.skipAuth).toBeUndefined();
    });

    test('posts to the community URL with skipAuth when a community is provided', async () => {
      mockPostResolved();

      await store.dispatch(createEvent(EVENT, COMMUNITY));

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = axios.post.mock.calls[0];
      expect(url).toBe(COMMUNITY_EVENTS_API_URL(COMMUNITY));
      expect(body).toBe(EVENT);
      expect(config.skipAuth).toBe(true);
    });
  });

  describe('addNoteToEvent', () => {
    test('posts to the authenticated notes URL without skipAuth when no community is provided', async () => {
      mockPostResolved();

      await store.dispatch(addNoteToEvent(EVENT.id, NOTE));

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = axios.post.mock.calls[0];
      expect(url).toBe(`${EVENT_API_URL}${EVENT.id}/notes/`);
      expect(body).toBe(NOTE);
      expect(config.skipAuth).toBeUndefined();
    });

    test('posts to the community notes URL with skipAuth when a community is provided', async () => {
      mockPostResolved();

      await store.dispatch(addNoteToEvent(EVENT.id, NOTE, COMMUNITY));

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = axios.post.mock.calls[0];
      expect(url).toBe(COMMUNITY_EVENT_NOTES_URL(COMMUNITY, EVENT.id));
      expect(body).toBe(NOTE);
      expect(config.skipAuth).toBe(true);
    });
  });

  describe('uploadEventFile', () => {
    test('posts to the authenticated files URL without skipAuth when no community is provided', async () => {
      mockPostResolved();

      await store.dispatch(uploadEventFile(EVENT.id, FILE));

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, , config] = axios.post.mock.calls[0];
      expect(url).toBe(`${EVENT_API_URL}${EVENT.id}/files/`);
      expect(config.skipAuth).toBeUndefined();
      expect(config.headers['Content-Type']).toBe('multipart/form-data');
    });

    test('posts to the community files URL with skipAuth when a community is provided', async () => {
      mockPostResolved();

      await store.dispatch(uploadEventFile(EVENT.id, FILE, COMMUNITY));

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, , config] = axios.post.mock.calls[0];
      expect(url).toBe(COMMUNITY_EVENT_FILES_URL(COMMUNITY, EVENT.id));
      expect(config.skipAuth).toBe(true);
      expect(config.headers['Content-Type']).toBe('multipart/form-data');
    });
  });

  describe('updateEvent', () => {
    test('patches the authenticated event URL', async () => {
      jest.spyOn(axios, 'patch').mockResolvedValue({ status: 200, data: { data: EVENT } });

      await store.dispatch(updateEvent(EVENT));

      expect(axios.patch).toHaveBeenCalledTimes(1);
      const [url] = axios.patch.mock.calls[0];
      expect(url).toBe(`${EVENT_API_URL}${EVENT.id}`);
    });
  });
});

describe('socketEventData', () => {
  const EVENT_ID = 'event-1';
  const EVENT_DATA = { id: EVENT_ID, geojson: { geometry: { type: 'Point', coordinates: [0, 0] } } };

  const buildPayload = (matches_current_filter) => ({
    count: 5,
    event_id: EVENT_ID,
    event_data: EVENT_DATA,
    matches_current_filter,
    type: 'update_event',
  });

  // The overlay-membership dispatch only happens with the vector tiles flag ON.
  const buildStore = () => mockStore({
    data: {},
    view: { systemConfig: { previewFeatures: { [PREVIEW_FEATURES.EVENTS_VECTOR_TILES]: true } } },
  });

  test('removes the event if it does not match the current filter and updates the event store', () => {
    const store = buildStore();

    store.dispatch(socketEventData(buildPayload(false)));

    const actions = store.getActions();
    expect(actions).toContainEqual({ type: REMOVE_EVENT_BY_ID, payload: EVENT_ID });
    expect(actions).not.toContainEqual(expect.objectContaining({ type: SOCKET_EVENT_DATA }));
    expect(actions).toContainEqual({ type: UPDATE_EVENT_STORE, payload: [EVENT_DATA] });
    expect(actions).toContainEqual(removeRealtimeOverlayEvent(EVENT_ID));
  });

  test('adds the event if it matches the current filter and updates the event store', () => {
    const store = buildStore();

    store.dispatch(socketEventData(buildPayload(true)));

    const actions = store.getActions();
    expect(actions).toContainEqual({ type: SOCKET_EVENT_DATA, payload: { count: 5, event_data: EVENT_DATA } });
    expect(actions).not.toContainEqual(expect.objectContaining({ type: REMOVE_EVENT_BY_ID }));
    expect(actions).toContainEqual({ type: UPDATE_EVENT_STORE, payload: [EVENT_DATA] });
    expect(actions).toContainEqual(
      expect.objectContaining({ type: addRealtimeOverlayEvent(EVENT_ID).type, payload: { id: EVENT_ID, addedAt: expect.any(Number) } })
    );
  });

  test('does not touch overlay membership when the vector tiles flag is off', () => {
    const store = mockStore({ data: {}, view: {} });

    store.dispatch(socketEventData(buildPayload(true)));

    const types = store.getActions().map((action) => action.type);
    expect(types).not.toContain(addRealtimeOverlayEvent(EVENT_ID).type);
    expect(types).not.toContain(removeRealtimeOverlayEvent(EVENT_ID).type);
  });
});

describe('socketUpdatePatrolEventLinks', () => {
  const PATROL = { id: 'patrol-id', patrol_segments: [] };

  test('unlinks the events a patrol push leaves out when reads see the same events as pushes', () => {
    const store = mockStore({ data: {}, view: {} });

    store.dispatch(socketUpdatePatrolEventLinks({ patrol_data: PATROL }));

    expect(store.getActions()).toEqual([{
      payload: { patrol: PATROL, shouldUnlinkUnlistedEvents: true },
      type: UPDATE_EVENT_PATROL_LINKS,
    }]);
  });

  test('keeps the events a patrol push leaves out linked when reads send the user location', () => {
    const store = mockStore({
      data: { user: { permissions: { view_events_geographic_distance: ['view'] } } },
      view: { userLocation: { coords: { latitude: 10, longitude: 20 } } },
    });

    store.dispatch(socketUpdatePatrolEventLinks({ patrol_data: PATROL }));

    expect(store.getActions()).toEqual([{
      payload: { patrol: PATROL, shouldUnlinkUnlistedEvents: false },
      type: UPDATE_EVENT_PATROL_LINKS,
    }]);
  });
});

describe('event links', () => {
  const geoRestrictedState = {
    data: { user: { permissions: { view_events_geographic_distance: ['view'] } } },
    view: { userLocation: { coords: { latitude: 10, longitude: 20 } } },
  };

  let fetchedEventIds;
  let fetchedPatrolIds;

  beforeEach(() => {
    fetchedEventIds = [];
    fetchedPatrolIds = [];

    server.use(
      http.get(`${EVENT_API_URL}:id`, ({ params }) => {
        fetchedEventIds.push(params.id);

        return HttpResponse.json({ data: { id: params.id } });
      }),
      http.get(`${PATROLS_API_URL}:id`, ({ params }) => {
        fetchedPatrolIds.push(params.id);

        return HttpResponse.json({ data: { id: params.id, patrol_segments: [] } });
      })
    );
  });

  describe('addEventToIncident', () => {
    test('adds the event to the incident, then refreshes both', async () => {
      let requestBody;
      server.use(http.post(EVENT_RELATIONSHIPS_API_URL('incident-id'), async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json({ data: {} }, { status: 201 });
      }));
      const store = mockStore({ data: {}, view: {} });

      const incidentResponse = await store.dispatch(addEventToIncident('event-id', 'incident-id'));

      expect(requestBody).toEqual({ to_event_id: 'event-id', type: 'contains' });
      expect(fetchedEventIds).toEqual(expect.arrayContaining(['event-id', 'incident-id']));
      expect(incidentResponse.data.data).toEqual({ id: 'incident-id' });
      expect(store.getActions()).toContainEqual({ payload: [{ id: 'incident-id' }], type: UPDATE_EVENT_STORE });
    });

    test('sends the location of a geographically restricted user', async () => {
      let searchParams;
      server.use(http.post(EVENT_RELATIONSHIPS_API_URL('incident-id'), ({ request }) => {
        searchParams = new URL(request.url).searchParams;

        return HttpResponse.json({ data: {} }, { status: 201 });
      }));

      await mockStore(geoRestrictedState).dispatch(addEventToIncident('event-id', 'incident-id'));

      expect(searchParams.get('location')).toBe('20,10');
    });

    test('rejects and warns without refreshing anything when the incident does not take the event', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.post(EVENT_RELATIONSHIPS_API_URL('incident-id'), () => new HttpResponse(null, { status: 403 })));

      await expect(mockStore({ data: {}, view: {} }).dispatch(addEventToIncident('event-id', 'incident-id')))
        .rejects.toThrow();

      expect(console.warn).toHaveBeenCalled();
      expect(fetchedEventIds).toEqual([]);
    });

    test('resolves when the event is added but a refresh fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(
        http.post(EVENT_RELATIONSHIPS_API_URL('incident-id'), () => HttpResponse.json({ data: {} }, { status: 201 })),
        http.get(`${EVENT_API_URL}:id`, () => new HttpResponse(null, { status: 500 }))
      );

      await expect(mockStore({ data: {}, view: {} }).dispatch(addEventToIncident('event-id', 'incident-id')))
        .resolves.toBeUndefined();
    });
  });

  describe('addEventToPatrol', () => {
    test('adds the event to the patrol without naming a leg, then refreshes the event and the loaded patrol', async () => {
      let requestBody;
      server.use(http.post(PATROL_EVENT_API_URL('patrol-id', 'event-id'), async ({ request }) => {
        requestBody = await request.text();

        return HttpResponse.json({ data: {} }, { status: 201 });
      }));
      const store = mockStore({ data: { patrolStore: { 'patrol-id': { id: 'patrol-id' } } }, view: {} });

      await store.dispatch(addEventToPatrol('event-id', 'patrol-id'));

      expect(requestBody).toBe('');
      expect(fetchedEventIds).toEqual(['event-id']);
      expect(fetchedPatrolIds).toEqual(['patrol-id']);
      expect(store.getActions()).toContainEqual(expect.objectContaining({ type: UPDATE_PATROL_SUCCESS }));
    });

    test('links the event to the leg it names', async () => {
      let requestBody;
      server.use(http.post(PATROL_EVENT_API_URL('patrol-id', 'event-id'), async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json({ data: {} }, { status: 201 });
      }));

      await mockStore({ data: { patrolStore: {} }, view: {} })
        .dispatch(addEventToPatrol('event-id', 'patrol-id', 'leg-id'));

      expect(requestBody).toEqual({ patrol_segment: 'leg-id' });
    });

    test('does not fetch a patrol that is not loaded', async () => {
      server.use(http.post(PATROL_EVENT_API_URL('patrol-id', 'event-id'), () => HttpResponse.json(
        { data: {} },
        { status: 201 }
      )));

      await mockStore({ data: { patrolStore: {} }, view: {} }).dispatch(addEventToPatrol('event-id', 'patrol-id'));

      expect(fetchedEventIds).toEqual(['event-id']);
      expect(fetchedPatrolIds).toEqual([]);
    });

    test('rejects and warns without refreshing anything when the patrol does not take the event', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.post(PATROL_EVENT_API_URL('patrol-id', 'event-id'), () => new HttpResponse(null, { status: 404 })));

      await expect(mockStore({ data: { patrolStore: {} }, view: {} }).dispatch(addEventToPatrol('event-id', 'patrol-id')))
        .rejects.toThrow();

      expect(console.warn).toHaveBeenCalled();
      expect(fetchedEventIds).toEqual([]);
    });
  });

  describe('removeEventFromIncident', () => {
    const incident = { id: 'incident-id', serial_number: 20 };

    beforeEach(() => {
      validateReportAgainstCurrentEventFilter.mockReturnValue(true);
    });

    test('removes the event from the incident, then refreshes both and adds the event back to the feed', async () => {
      let removedRelationship = false;
      server.use(http.delete(INCIDENT_EVENT_API_URL('incident-id', 'event-id'), () => {
        removedRelationship = true;

        return HttpResponse.json({ data: null });
      }));
      const store = mockStore({ data: { eventStore: {} }, view: {} });

      await store.dispatch(removeEventFromIncident('event-id', 'incident-id'));

      expect(removedRelationship).toBe(true);
      expect(fetchedEventIds).toEqual(expect.arrayContaining(['event-id', 'incident-id']));
      expect(store.getActions()).toContainEqual({ payload: 'event-id', type: ADD_EVENT_TO_FEEDS });
    });

    test('resolves to the incident the event left', async () => {
      server.use(http.delete(INCIDENT_EVENT_API_URL('incident-id', 'event-id'), () => HttpResponse.json({ data: null })));
      const store = mockStore({ data: { eventStore: { 'incident-id': incident } }, view: {} });

      await expect(store.dispatch(removeEventFromIncident('event-id', 'incident-id'))).resolves.toEqual(incident);
    });

    test('does not add the event to the feed when it does not match the event filter', async () => {
      validateReportAgainstCurrentEventFilter.mockReturnValue(false);
      server.use(http.delete(INCIDENT_EVENT_API_URL('incident-id', 'event-id'), () => HttpResponse.json({ data: null })));
      const store = mockStore({ data: { eventStore: {} }, view: {} });

      await store.dispatch(removeEventFromIncident('event-id', 'incident-id'));

      expect(store.getActions()).not.toContainEqual(expect.objectContaining({ type: ADD_EVENT_TO_FEEDS }));
    });

    test('sends the location of a geographically restricted user', async () => {
      let searchParams;
      server.use(http.delete(INCIDENT_EVENT_API_URL('incident-id', 'event-id'), ({ request }) => {
        searchParams = new URL(request.url).searchParams;

        return HttpResponse.json({ data: null });
      }));

      await mockStore({ ...geoRestrictedState, data: { ...geoRestrictedState.data, eventStore: {} } })
        .dispatch(removeEventFromIncident('event-id', 'incident-id'));

      expect(searchParams.get('location')).toBe('20,10');
    });

    test('rejects and warns without refreshing anything when the incident keeps the event', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.delete(INCIDENT_EVENT_API_URL('incident-id', 'event-id'), () => new HttpResponse(null, { status: 403 })));
      const store = mockStore({ data: { eventStore: {} }, view: {} });

      await expect(store.dispatch(removeEventFromIncident('event-id', 'incident-id'))).rejects.toThrow();

      expect(console.warn).toHaveBeenCalled();
      expect(fetchedEventIds).toEqual([]);
      expect(store.getActions()).not.toContainEqual(expect.objectContaining({ type: ADD_EVENT_TO_FEEDS }));
    });

    test('resolves to no incident, without touching the feed, when the event is removed but the refresh fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(
        http.delete(INCIDENT_EVENT_API_URL('incident-id', 'event-id'), () => HttpResponse.json({ data: null })),
        http.get(`${EVENT_API_URL}:id`, () => new HttpResponse(null, { status: 500 }))
      );
      const store = mockStore({ data: { eventStore: {} }, view: {} });

      await expect(store.dispatch(removeEventFromIncident('event-id', 'incident-id'))).resolves.toBeNull();

      expect(store.getActions()).not.toContainEqual(expect.objectContaining({ type: ADD_EVENT_TO_FEEDS }));
    });
  });

  describe('removeEventFromPatrol', () => {
    const patrol = { id: 'patrol-id', serial_number: 1595 };

    test('removes the event from the patrol, then refreshes the event and the patrol', async () => {
      let removedLink = false;
      server.use(http.delete(PATROL_EVENT_API_URL('patrol-id', 'event-id'), () => {
        removedLink = true;

        return new HttpResponse(null, { status: 204 });
      }));
      const store = mockStore({ data: { patrolStore: { 'patrol-id': patrol } }, view: {} });

      await expect(store.dispatch(removeEventFromPatrol('event-id', 'patrol-id'))).resolves.toEqual(patrol);

      expect(removedLink).toBe(true);
      expect(fetchedEventIds).toEqual(['event-id']);
      expect(fetchedPatrolIds).toEqual(['patrol-id']);
    });

    test('fetches a patrol that is not loaded, since nothing else names it', async () => {
      server.use(http.delete(PATROL_EVENT_API_URL('patrol-id', 'event-id'), () => new HttpResponse(null, { status: 204 })));

      await mockStore({ data: { patrolStore: {} }, view: {} }).dispatch(removeEventFromPatrol('event-id', 'patrol-id'));

      expect(fetchedPatrolIds).toEqual(['patrol-id']);
    });

    test('rejects and warns without refreshing anything when the patrol keeps the event', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.delete(PATROL_EVENT_API_URL('patrol-id', 'event-id'), () => new HttpResponse(null, { status: 404 })));

      await expect(mockStore({ data: { patrolStore: {} }, view: {} })
        .dispatch(removeEventFromPatrol('event-id', 'patrol-id'))).rejects.toThrow();

      expect(console.warn).toHaveBeenCalled();
      expect(fetchedEventIds).toEqual([]);
    });
  });

  describe('fetchIncidentLinkTargets', () => {
    test('requests the incidents matching the search text, last updated first', async () => {
      let searchParams;
      server.use(http.get(EVENTS_API_URL, ({ request }) => {
        searchParams = new URL(request.url).searchParams;

        return HttpResponse.json({ data: { count: 1, next: null, results: [{ id: 'incident-id' }] } });
      }));

      const page = await mockStore({ data: {}, view: {} }).dispatch(fetchIncidentLinkTargets('snare'));

      expect(page.results).toEqual([{ id: 'incident-id' }]);
      expect(searchParams.get('is_collection')).toBe('true');
      expect(searchParams.get('include_related_events')).toBe('true');
      expect(searchParams.get('filter')).toBe(JSON.stringify({ text: 'snare' }));
      expect(searchParams.get('sort_by')).toBe('-updated_at');
      expect(searchParams.get('page_size')).toBe('25');
      expect(searchParams.has('location')).toBe(false);
    });

    test('sends the location of a geographically restricted user', async () => {
      let searchParams;
      server.use(http.get(EVENTS_API_URL, ({ request }) => {
        searchParams = new URL(request.url).searchParams;

        return HttpResponse.json({ data: { count: 0, next: null, results: [] } });
      }));

      await mockStore(geoRestrictedState).dispatch(fetchIncidentLinkTargets(''));

      expect(searchParams.get('location')).toBe('20,10');
      expect(searchParams.has('filter')).toBe(false);
    });

    test('rejects and warns when the request fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.get(EVENTS_API_URL, () => new HttpResponse(null, { status: 500 })));

      await expect(mockStore({ data: {}, view: {} }).dispatch(fetchIncidentLinkTargets(''))).rejects.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});

describe('eventFeedReducer', () => {
  const NEXT_PAGE_URL = `${EVENTS_API_URL}?page=2`;

  const nextPage = (url, ids) => ({
    name: EVENT_FEED_NAME,
    payload: { count: 10, next: null, previous: null, results: ids.map((id) => ({ id })), url },
    type: FEED_FETCH_NEXT_PAGE_SUCCESS,
  });

  test('appends the events of the next page it has not listed yet', () => {
    const state = { ...INITIAL_EVENT_FEED_STATE, next: NEXT_PAGE_URL, results: ['event-1', 'event-2'] };

    const nextState = eventFeedReducer(state, nextPage(NEXT_PAGE_URL, ['event-2', 'event-3']));

    expect(nextState.results).toEqual(['event-1', 'event-2', 'event-3']);
    expect(nextState.next).toBeNull();
  });

  test('ignores a page asked for before the feed was refreshed', () => {
    const state = { ...INITIAL_EVENT_FEED_STATE, next: `${EVENTS_API_URL}?page=2&state=active`, results: ['event-1'] };

    expect(eventFeedReducer(state, nextPage(NEXT_PAGE_URL, ['event-2']))).toBe(state);
  });

  test('drops an event that joins an incident when the feed leaves those events out', () => {
    const state = eventFeedReducer(INITIAL_EVENT_FEED_STATE, {
      name: EVENT_FEED_NAME,
      payload: { isExcludingContained: true, next: null, results: [{ id: 'event-1' }] },
      type: FEED_FETCH_SUCCESS,
    });

    const nextState = eventFeedReducer(state, {
      payload: { event_data: { id: 'event-1', is_contained_in: [{ related_event: { id: 'incident-1' } }] } },
      type: SOCKET_EVENT_DATA,
    });

    expect(nextState.results).toEqual([]);
  });

  test('keeps an event that joins an incident when the feed lists those events', () => {
    const state = eventFeedReducer(INITIAL_EVENT_FEED_STATE, {
      name: EVENT_FEED_NAME,
      payload: { isExcludingContained: false, next: null, results: [{ id: 'event-1' }] },
      type: FEED_FETCH_SUCCESS,
    });

    const nextState = eventFeedReducer(state, {
      payload: { event_data: { id: 'event-1', is_contained_in: [{ related_event: { id: 'incident-1' } }] } },
      type: SOCKET_EVENT_DATA,
    });

    expect(nextState.results).toEqual(['event-1']);
  });

  test('adds an event to the feed once', () => {
    const state = { ...INITIAL_EVENT_FEED_STATE, results: ['other-event-id'] };

    const nextState = eventFeedReducer(state, { payload: 'event-id', type: ADD_EVENT_TO_FEEDS });

    expect(nextState.results).toEqual(['event-id', 'other-event-id']);
    expect(eventFeedReducer(nextState, { payload: 'event-id', type: ADD_EVENT_TO_FEEDS }).results)
      .toEqual(['event-id', 'other-event-id']);
  });
});
