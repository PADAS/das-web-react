import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import eventCategoriesReducer, {
  EVENT_CATEGORIES_API_URL,
  FETCH_EVENT_CATEGORIES_SUCCESS,
  fetchEventCategories,
  INITIAL_STATE,
} from './';
import { monitoringCategory, securityCategory } from '../../__test-helpers/fixtures/event-categories';

const server = setupServer(
  http.get(`${EVENT_CATEGORIES_API_URL}`, () => HttpResponse.json({ data: [monitoringCategory, securityCategory] })),
);

describe('Ducks - Event categories', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('fetchEventCategories dispatches the FETCH_EVENT_CATEGORIES_SUCCESS action', async () => {
    const dispatch = jest.fn();

    await fetchEventCategories()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        monitoring: monitoringCategory,
        security: securityCategory,
      },
      type: FETCH_EVENT_CATEGORIES_SUCCESS,
    });
  });

  describe('eventCategoriesReducer', () => {
    test('returns the initial state', async () => {
      expect(eventCategoriesReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a FETCH_EVENT_CATEGORIES_SUCCESS action', async () => {
      const payload = { monitoring: monitoringCategory, security: securityCategory };
      const action = { payload, type: FETCH_EVENT_CATEGORIES_SUCCESS };
      const expectedState = { monitoring: monitoringCategory, security: securityCategory };

      expect(eventCategoriesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
