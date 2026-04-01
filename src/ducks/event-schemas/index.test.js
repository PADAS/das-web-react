import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import eventSchemasReducer, {
  COMMUNITY_EVENTS_SCHEMA_API_URL,
  COMMUNITY_EVENT_TYPE_SCHEMA_URL,
  EVENT_TYPE_SCHEMA_V1_URL,
  EVENT_TYPE_SCHEMA_V2_URL,
  EVENTS_SCHEMA_API_URL,
  FETCH_EVENT_TYPE_SCHEMA,
  FETCH_EVENT_TYPE_SCHEMA_FAILURE,
  FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS,
  FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS,
  FETCH_EVENTS_SCHEMA_SUCCESS,
  fetchEventsSchema,
  fetchEventTypeSchema,
  INITIAL_STATE,
} from './';
import { globalSchema, snareSchemaV1, snareSchemaV2 } from '../../__test-helpers/fixtures/event-schemas';
import sanitizeSchemas from './sanitizeSchemas';

const server = setupServer(
  http.get(EVENT_TYPE_SCHEMA_V1_URL('snare_rep'), () => HttpResponse.json({ data: snareSchemaV1 })),
  http.get(EVENT_TYPE_SCHEMA_V2_URL('snare_rep'), () => HttpResponse.json(snareSchemaV2)),
  http.get(`${EVENTS_SCHEMA_API_URL}`, () => HttpResponse.json({ data: globalSchema })),
  http.get(COMMUNITY_EVENTS_SCHEMA_API_URL('test-community'), () => HttpResponse.json({ data: globalSchema })),
  http.get(COMMUNITY_EVENT_TYPE_SCHEMA_URL('test-community', 'snare_rep'), () => HttpResponse.json(snareSchemaV2)),
);

describe('Ducks - Event schemas', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('fetchEventsSchema dispatches the FETCH_EVENTS_SCHEMA_SUCCESS action', async () => {
    const dispatch = jest.fn();

    await fetchEventsSchema()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ payload: globalSchema, type: FETCH_EVENTS_SCHEMA_SUCCESS });
  });

  test('fetchEventsSchema uses the community URL when community_input is provided', async () => {
    const dispatch = jest.fn();

    await fetchEventsSchema({ community_input: 'test-community' })(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ payload: globalSchema, type: FETCH_EVENTS_SCHEMA_SUCCESS });
  });

  test('fetchEventTypeSchema dispatches the FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS action after fetching a v1 schema', async () => {
    const dispatch = jest.fn();
    const getState = () => ({
      data: {
        eventTypes: [{
          value: 'snare_rep',
          version: 1,
        }],
      },
      view: {},
    });

    await fetchEventTypeSchema('snare_rep', '123')(dispatch, getState);
    const { schema, uiSchema } = sanitizeSchemas(snareSchemaV1);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ type: FETCH_EVENT_TYPE_SCHEMA });
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        definition: snareSchemaV1.definition,
        eventId: '123',
        eventTypeValue: 'snare_rep',
        schema,
        uiSchema,
      },
      type: FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS,
    });
  });

  test('fetchEventTypeSchema dispatches the FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS action after fetching a v2 schema', async () => {
    const dispatch = jest.fn();
    const getState = () => ({
      data: {
        eventTypes: [{
          value: 'snare_rep',
          version: 2,
        }],
      },
      view: {},
    });

    await fetchEventTypeSchema('snare_rep', '123')(dispatch, getState);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ type: FETCH_EVENT_TYPE_SCHEMA });
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        eventId: '123',
        eventTypeValue: 'snare_rep',
        schema: snareSchemaV2,
      },
      type: FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS,
    });
  });

  test('fetchEventTypeSchema uses the community URL and dispatches FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS when community_input is provided', async () => {
    const dispatch = jest.fn();
    const getState = () => ({
      data: {
        eventTypes: [{
          value: 'snare_rep',
          version: 2,
        }],
      },
      view: {},
    });

    await fetchEventTypeSchema('snare_rep', '123', { community_input: 'test-community' })(dispatch, getState);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ type: FETCH_EVENT_TYPE_SCHEMA });
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        eventId: '123',
        eventTypeValue: 'snare_rep',
        schema: snareSchemaV2,
      },
      type: FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS,
    });
  });

  test('fetchEventTypeSchema uses the community URL for v1 event types when community_input is provided', async () => {
    const dispatch = jest.fn();
    const getState = () => ({
      data: {
        eventTypes: [{
          value: 'snare_rep',
          version: 1,
        }],
      },
      view: {},
    });

    server.use(
      http.get(COMMUNITY_EVENT_TYPE_SCHEMA_URL('test-community', 'snare_rep'), () => HttpResponse.json(snareSchemaV2)),
    );

    await fetchEventTypeSchema('snare_rep', '123', { community_input: 'test-community' })(dispatch, getState);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ type: FETCH_EVENT_TYPE_SCHEMA });
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        eventId: '123',
        eventTypeValue: 'snare_rep',
        schema: snareSchemaV2,
      },
      type: FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS,
    });
  });

  test('fetchEventTypeSchema dispatches the FETCH_EVENT_TYPE_SCHEMA_FAILURE action', async () => {
    const dispatch = jest.fn();
    const getState = () => ({
      data: { eventTypes: [] },
      view: {},
    });

    await fetchEventTypeSchema('snare_rep', '123')(dispatch, getState);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ type: FETCH_EVENT_TYPE_SCHEMA });
    expect(dispatch.mock.calls[1][0].type).toBe(FETCH_EVENT_TYPE_SCHEMA_FAILURE);
  });

  describe('eventSchemasReducer', () => {
    test('returns the initial state', async () => {
      expect(eventSchemasReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA action', async () => {
      const action = { type: FETCH_EVENT_TYPE_SCHEMA };
      const expectedState = { loading: true };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA_FAILURE action', async () => {
      const payload = { error: 'Error', eventId: '123', eventTypeValue: 'snare_rep' };
      const action = { payload, type: FETCH_EVENT_TYPE_SCHEMA_FAILURE };
      const expectedState = {
        loading: false,
        snare_rep: {
          123: 'Error',
        },
      };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA_FAILURE action with a base schema', async () => {
      const payload = { error: 'Error', eventTypeValue: 'snare_rep' };
      const action = { payload, type: FETCH_EVENT_TYPE_SCHEMA_FAILURE };
      const expectedState = {
        loading: false,
        snare_rep: {
          base: 'Error',
        },
      };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS action', async () => {
      const payload = {
        definition: {},
        eventId: '123',
        eventTypeValue: 'snare_rep',
        schema: {},
        uiSchema: {},
      };
      const action = { payload, type: FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS };
      const expectedState = {
        loading: false,
        snare_rep: {
          123: {
            definition: {},
            schema: {},
            uiSchema: {},
          },
        },
      };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS action with a base schema', async () => {
      const payload = {
        definition: {},
        eventTypeValue: 'snare_rep',
        schema: {},
        uiSchema: {},
      };
      const action = { payload, type: FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS };
      const expectedState = {
        loading: false,
        snare_rep: {
          base: {
            definition: {},
            schema: {},
            uiSchema: {},
          },
        },
      };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS action', async () => {
      const payload = {
        eventId: '123',
        eventTypeValue: 'snare_rep',
        schema: {
          json: {},
          ui: {},
        },
      };
      const action = { payload, type: FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS };
      const expectedState = {
        loading: false,
        snare_rep: {
          123: {
            json: {},
            ui: {},
          },
        },
      };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS action with a base schema', async () => {
      const payload = {
        eventTypeValue: 'snare_rep',
        schema: {
          json: {},
          ui: {},
        },
      };
      const action = { payload, type: FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS };
      const expectedState = {
        loading: false,
        snare_rep: {
          base: {
            json: {},
            ui: {},
          },
        },
      };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a FETCH_EVENTS_SCHEMA_SUCCESS action', async () => {
      const payload = globalSchema;
      const action = { payload, type: FETCH_EVENTS_SCHEMA_SUCCESS };
      const expectedState = { globalSchema: globalSchema, loading: false };

      expect(eventSchemasReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
