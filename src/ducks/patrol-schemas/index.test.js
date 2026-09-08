import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { defaultPatrolSegmentTypeSchema, patrolTypeFieldsSchema } from '../../__test-helpers/fixtures/patrol-schemas';
import { mockStore } from '../../__test-helpers/MockStore';
import { resetGlobalState } from '../../reducers/global-resettable';

import patrolSchemasReducer, {
  DEFAULT_PATROL_SEGMENT_TYPE,
  DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL,
  FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA,
  FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE,
  FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS,
  FETCH_PATROL_TYPE_SCHEMA,
  FETCH_PATROL_TYPE_SCHEMA_FAILURE,
  FETCH_PATROL_TYPE_SCHEMA_SUCCESS,
  fetchDefaultPatrolSegmentTypeSchema,
  fetchPatrolTypeSchema,
  INITIAL_STATE,
  PATROL_TYPE_SCHEMA_API_URL,
} from './';

const server = setupServer(
  http.get(
    PATROL_TYPE_SCHEMA_API_URL('dog_patrol'),
    () => HttpResponse.json({ data: patrolTypeFieldsSchema })
  ),
  http.get(
    DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL,
    () => HttpResponse.json({ data: defaultPatrolSegmentTypeSchema })
  ),
);

describe('Ducks - Patrol schemas', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  describe('fetchPatrolTypeSchema', () => {
    test('stores the schema of the patrol type it is asked for', async () => {
      const dispatch = jest.fn();

      await fetchPatrolTypeSchema('dog_patrol')(dispatch);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith({
        payload: { patrolTypeValue: 'dog_patrol' },
        type: FETCH_PATROL_TYPE_SCHEMA,
      });
      expect(dispatch).toHaveBeenCalledWith({
        payload: { patrolTypeValue: 'dog_patrol', schema: patrolTypeFieldsSchema },
        type: FETCH_PATROL_TYPE_SCHEMA_SUCCESS,
      });
    });

    test('asks for the schema pre rendered and with its choice lists as enumerations', async () => {
      let requestParams;
      server.use(http.get(PATROL_TYPE_SCHEMA_API_URL('dog_patrol'), ({ request }) => {
        requestParams = new URL(request.url).searchParams;

        return HttpResponse.json({ data: patrolTypeFieldsSchema });
      }));

      await fetchPatrolTypeSchema('dog_patrol')(jest.fn());

      expect(requestParams.get('pre_render')).toBe('true');
      expect(requestParams.get('s_format')).toBe('enum');
    });

    test('reads the schema out of an answer that does not wrap it', async () => {
      const dispatch = jest.fn();
      server.use(http.get(PATROL_TYPE_SCHEMA_API_URL('dog_patrol'), () => HttpResponse.json(patrolTypeFieldsSchema)));

      await fetchPatrolTypeSchema('dog_patrol')(dispatch);

      expect(dispatch).toHaveBeenCalledWith({
        payload: { patrolTypeValue: 'dog_patrol', schema: patrolTypeFieldsSchema },
        type: FETCH_PATROL_TYPE_SCHEMA_SUCCESS,
      });
    });

    test('reports the failure when the schema cannot be fetched', async () => {
      const dispatch = jest.fn();
      server.use(http.get(PATROL_TYPE_SCHEMA_API_URL('dog_patrol'), () => HttpResponse.error()));

      await fetchPatrolTypeSchema('dog_patrol')(dispatch);

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch.mock.calls[1][0].type).toBe(FETCH_PATROL_TYPE_SCHEMA_FAILURE);
      expect(dispatch.mock.calls[1][0].payload.patrolTypeValue).toBe('dog_patrol');
      expect(dispatch.mock.calls[1][0].payload.error).toBeInstanceOf(Error);
    });
  });

  describe('fetchDefaultPatrolSegmentTypeSchema', () => {
    test('stores the schema of the fields every leg renders and hands it back', async () => {
      const store = mockStore({ data: {}, view: {} });

      const schema = await store.dispatch(fetchDefaultPatrolSegmentTypeSchema());

      expect(schema).toEqual(defaultPatrolSegmentTypeSchema);
      expect(store.getActions()).toEqual([
        { type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA },
        { payload: defaultPatrolSegmentTypeSchema, type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS },
      ]);
    });

    test('reports the error of a schema that could not be fetched', async () => {
      const store = mockStore({ data: {}, view: {} });
      server.use(http.get(
        DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL,
        () => new HttpResponse(null, { status: 500 })
      ));

      expect(await store.dispatch(fetchDefaultPatrolSegmentTypeSchema())).toBeNull();
      expect(store.getActions()).toEqual([
        { type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA },
        { payload: expect.any(Error), type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE },
      ]);
    });

    test('reads the schema out of an answer that does not wrap it', async () => {
      const store = mockStore({ data: {}, view: {} });
      server.use(http.get(
        DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL,
        () => HttpResponse.json(defaultPatrolSegmentTypeSchema)
      ));

      expect(await store.dispatch(fetchDefaultPatrolSegmentTypeSchema())).toEqual(defaultPatrolSegmentTypeSchema);
    });

    test('asks for the schema pre rendered and with its choice lists as enumerations', async () => {
      let requestParams;
      server.use(http.get(DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL, ({ request }) => {
        requestParams = new URL(request.url).searchParams;

        return HttpResponse.json({ data: defaultPatrolSegmentTypeSchema });
      }));

      await fetchDefaultPatrolSegmentTypeSchema()(jest.fn());

      expect(requestParams.get('pre_render')).toBe('true');
      expect(requestParams.get('s_format')).toBe('enum');
    });

  });

  describe('patrolSchemasReducer', () => {
    test('starts without any patrol type schema', () => {
      expect(patrolSchemasReducer(undefined, { type: 'UNKNOWN' })).toEqual(INITIAL_STATE);
    });

    test('marks the schema of a patrol type as on its way while it is fetched', () => {
      const state = patrolSchemasReducer(
        INITIAL_STATE,
        { payload: { patrolTypeValue: 'dog_patrol' }, type: FETCH_PATROL_TYPE_SCHEMA }
      );

      expect(state).toEqual({ dog_patrol: { isLoading: true } });
    });

    test('stores the schema a patrol type serves', () => {
      const state = patrolSchemasReducer(
        { dog_patrol: { isLoading: true } },
        {
          payload: { patrolTypeValue: 'dog_patrol', schema: patrolTypeFieldsSchema },
          type: FETCH_PATROL_TYPE_SCHEMA_SUCCESS,
        }
      );

      expect(state).toEqual({ dog_patrol: { isLoading: false, schema: patrolTypeFieldsSchema } });
    });

    test('keeps the schemas of the patrol types it already has', () => {
      const state = patrolSchemasReducer(
        { dog_patrol: { isLoading: false, schema: patrolTypeFieldsSchema } },
        {
          payload: { patrolTypeValue: 'routine_patrol', schema: patrolTypeFieldsSchema },
          type: FETCH_PATROL_TYPE_SCHEMA_SUCCESS,
        }
      );

      expect(Object.keys(state)).toEqual(['dog_patrol', 'routine_patrol']);
    });

    test('stores the error of a schema that could not be fetched', () => {
      const error = new Error('Oops');

      const state = patrolSchemasReducer(
        { dog_patrol: { isLoading: true } },
        { payload: { error, patrolTypeValue: 'dog_patrol' }, type: FETCH_PATROL_TYPE_SCHEMA_FAILURE }
      );

      expect(state).toEqual({ dog_patrol: { error, isLoading: false } });
    });

    test('marks the schema of the fields every leg renders as on its way while it is fetched', () => {
      const state = patrolSchemasReducer(INITIAL_STATE, { type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA });

      expect(state).toEqual({ [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: true } });
    });

    test('stores the error of the fields every leg renders when they could not be fetched', () => {
      const error = new Error('Oops');

      const state = patrolSchemasReducer(
        { [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: true } },
        { payload: error, type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE }
      );

      expect(state).toEqual({ [DEFAULT_PATROL_SEGMENT_TYPE]: { error, isLoading: false } });
    });

    test('stores the schema of the fields every leg renders beside the patrol type ones', () => {
      const state = patrolSchemasReducer(
        { dog_patrol: { isLoading: false, schema: patrolTypeFieldsSchema } },
        { payload: defaultPatrolSegmentTypeSchema, type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS }
      );

      expect(state).toEqual({
        [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: defaultPatrolSegmentTypeSchema },
        dog_patrol: { isLoading: false, schema: patrolTypeFieldsSchema },
      });
    });

    test('forgets the schemas on a global reset', () => {
      const state = patrolSchemasReducer(
        { dog_patrol: { isLoading: false, schema: patrolTypeFieldsSchema } },
        resetGlobalState()
      );

      expect(state).toEqual(INITIAL_STATE);
    });
  });
});
