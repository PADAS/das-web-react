import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import eventTypesReducer, {
  COMMUNITY_EVENT_TYPES_API_URL,
  EVENT_TYPES_API_URL,
  EVENT_TYPES_V2_API_URL,
  FETCH_EVENT_TYPES_SUCCESS,
  fetchEventTypes,
  INITIAL_STATE,
} from './';
import { animalControlTypeV2, fireTypeV2, snareTypeV1, spoorTypeV1 } from '../../__test-helpers/fixtures/event-types';

const server = setupServer(
  http.get(`${EVENT_TYPES_API_URL}`, () => HttpResponse.json({ data: [snareTypeV1, spoorTypeV1] })),
  http.get(`${EVENT_TYPES_V2_API_URL}`, () => HttpResponse.json({ data: [animalControlTypeV2, fireTypeV2] })),
  http.get(COMMUNITY_EVENT_TYPES_API_URL('test-community'), () => HttpResponse.json({ data: [snareTypeV1, spoorTypeV1] })),
);

describe('Ducks - Event types', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('fetchEventTypes dispatches the FETCH_EVENT_TYPES_SUCCESS action with both v1 and v2 types by default', async () => {
    const dispatch = jest.fn();

    await fetchEventTypes()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      payload: [
        { ...animalControlTypeV2, version: 2 },
        { ...fireTypeV2, version: 2 },
        { ...snareTypeV1, version: 1 },
        { ...spoorTypeV1, version: 1 },
      ],
      type: FETCH_EVENT_TYPES_SUCCESS,
    });
  });


  test('fetchEventTypes uses the community URL and marks all types as version 2 when community_input is provided', async () => {
    const dispatch = jest.fn();

    await fetchEventTypes({ community_input: 'test-community' })(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      payload: [
        { ...snareTypeV1, version: 2 },
        { ...spoorTypeV1, version: 2 },
      ],
      type: FETCH_EVENT_TYPES_SUCCESS,
    });
  });

  describe('eventTypesReducer', () => {
    test('returns the initial state', async () => {
      expect(eventTypesReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a FETCH_EVENT_TYPES_SUCCESS action', async () => {
      const payload = [
        { ...snareTypeV1, version: 1 },
        { ...spoorTypeV1, version: 1 },
        { ...animalControlTypeV2, version: 2 },
        { ...fireTypeV2, version: 2 },
      ];
      const action = { payload, type: FETCH_EVENT_TYPES_SUCCESS };
      const expectedState = [
        { ...snareTypeV1, version: 1 },
        { ...spoorTypeV1, version: 1 },
        { ...animalControlTypeV2, version: 2 },
        { ...fireTypeV2, version: 2 },
      ];

      expect(eventTypesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
