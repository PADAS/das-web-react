import { generateDaysAgoDate } from '../../utils/datetime';
import { mockStore } from '../../__test-helpers/MockStore';

import eventFilterReducer, {
  INITIAL_FILTER_STATE,
  setDefaultDateRange,
  updateEventFilter,
  UPDATE_EVENT_FILTER,
} from './';

describe('Ducks - Event filter', () => {
  describe('eventFilterReducer', () => {
    test('should return the initial state', async () => {
      expect(eventFilterReducer(undefined, {})).toEqual(INITIAL_FILTER_STATE);
    });

    test('should handle a UPDATE_EVENT_FILTER action', async () => {
      const previousState = INITIAL_FILTER_STATE;
      const payload =
        {
          include_notes: false,
          include_files: false,
          include_related_events: false,
          state: ['resolved'],
          filter: {
            date_range: {
              lower: new Date().toISOString(),
              upper: new Date().toISOString(),
            },
            event_type: 'shot_rep',
            event_category: 'security',
            text: 'text',
            priority: 200,
          },
        };
      const action = { payload, type: UPDATE_EVENT_FILTER };
      const expectedState = {
        ...INITIAL_FILTER_STATE,
        ...payload,
        filter: {
          ...INITIAL_FILTER_STATE.filter,
          ...payload.filter,
        },
      };

      expect(eventFilterReducer(previousState, action)).toEqual(expectedState);
    });
  });

  test('updateEventFilter dispatches the UPDATE_EVENT_FILTER action', () => {
    const dispatch = jest.fn();

    const update = { filter: { text: 'filter text' } };
    updateEventFilter(update)(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ payload: update, type: UPDATE_EVENT_FILTER });
  });

  describe('setDefaultDateRange', () => {
    const generateStore = (dateRange) => mockStore({
      data: {
        eventFilter: { ...INITIAL_FILTER_STATE, filter: { ...INITIAL_FILTER_STATE.filter, date_range: dateRange } },
      },
    });

    test('updates the default date range and moves a filter at the previous default to it', () => {
      const lower = generateDaysAgoDate(5).toISOString();
      const store = generateStore({ ...INITIAL_FILTER_STATE.filter.date_range });

      store.dispatch(setDefaultDateRange(lower, null));

      expect(INITIAL_FILTER_STATE.filter.date_range).toEqual({ lower, upper: null });
      expect(store.getActions()).toEqual([
        { payload: { filter: { date_range: { lower, upper: null } } }, type: UPDATE_EVENT_FILTER },
      ]);
    });

    test('updates the default date range but keeps a custom date range in the filter', () => {
      const lower = generateDaysAgoDate(7).toISOString();
      const store = generateStore({ lower: '2026-01-01T00:00:00.000Z', upper: null });

      store.dispatch(setDefaultDateRange(lower, null));

      expect(INITIAL_FILTER_STATE.filter.date_range).toEqual({ lower, upper: null });
      expect(store.getActions()).toEqual([]);
    });
  });
});
