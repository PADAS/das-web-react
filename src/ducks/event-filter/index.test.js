import { generateDaysAgoDate } from '../../utils/datetime';
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

  test('setDefaultDateRange creates the UPDATE_EVENT_FILTER action and updates the INITIAL_FILTER_STATE', () => {
    const lower = generateDaysAgoDate(5).toISOString();
    const upper = null;

    const action = setDefaultDateRange(lower, upper);

    expect(action).toEqual({ payload: { filter: { date_range: { lower, upper } } }, type: UPDATE_EVENT_FILTER });
    expect(INITIAL_FILTER_STATE.filter.date_range.lower).toBe(lower);
    expect(INITIAL_FILTER_STATE.filter.date_range.upper).toBe(upper);
  });
});
