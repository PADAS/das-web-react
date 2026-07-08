import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import {
  addNoteToEvent,
  COMMUNITY_EVENT_FILES_URL,
  COMMUNITY_EVENT_NOTES_URL,
  COMMUNITY_EVENTS_API_URL,
  createEvent,
  EVENT_API_URL,
  EVENTS_API_URL,
  fetchMapEvents,
  fetchRecentEventsIntoRealtimeOverlay,
  REMOVE_EVENT_BY_ID,
  SOCKET_EVENT_DATA,
  socketEventData,
  UPDATE_EVENT_STORE,
  updateEvent,
  uploadEventFile,
} from './events';
import { ADD_EVENT, addRealtimeOverlayEvent, REMOVE_EVENT, removeRealtimeOverlayEvent } from './events-realtime-overlay';
import { PREVIEW_FEATURES } from '../constants';

jest.mock('../utils/events', () => ({
  ...jest.requireActual('../utils/events'),
  validateReportAgainstCurrentEventFilter: jest.fn(() => true),
}));

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
    await store.dispatch(fetchMapEvents())
      .catch((error) => {
        expect(error).toEqual('no map available');
      });
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
  test('handling 403 Forbidden errors for geo-permission-restricted users', () => {
    const server = setupServer(
      http.get(EVENTS_API_URL, () => HttpResponse.json({
        errorMessage: 'Geo-permissions required to access this data',
      }, { status: 403 }))
    );

    server.listen();


    server.close();
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
