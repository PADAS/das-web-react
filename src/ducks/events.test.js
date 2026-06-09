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
  updateEvent,
  uploadEventFile,
} from './events';

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
