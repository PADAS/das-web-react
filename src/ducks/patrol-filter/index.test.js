import { generateDaysAgoDate } from '../../utils/datetime';
import patrolFilterReducer, {
  INITIAL_FILTER_STATE,
  persistenceConfig,
  setDefaultDateRange,
  updatePatrolFilter,
  UPDATE_PATROL_FILTER,
} from './';

describe('Ducks - Patrol filter', () => {
  describe('patrolFilterReducer', () => {
    test('should return the initial state', async () => {
      expect(patrolFilterReducer(undefined, {})).toEqual(INITIAL_FILTER_STATE);
    });

    test('should handle a UPDATE_PATROL_FILTER action', async () => {
      const previousState = INITIAL_FILTER_STATE;
      const payload =
        {
          filter: {
            date_range: {
              lower: new Date().toISOString(),
              upper: new Date().toISOString(),
            },
            patrols_overlap_daterange: true,
            patrol_type: ['2', '3'],
            status: ['overdue'],
            text: 'filter text',
            leader: '1',
          },
        };
      const action = { payload, type: UPDATE_PATROL_FILTER };
      const expectedState = {
        ...INITIAL_FILTER_STATE,
        filter: {
          ...INITIAL_FILTER_STATE.filter,
          ...payload.filter,
        },
      };

      expect(patrolFilterReducer(previousState, action)).toEqual(expectedState);
    });
  });

  test('updatePatrolFilter dispatches the UPDATE_PATROL_FILTER action', () => {
    const dispatch = jest.fn();

    const update = { filter: { text: 'filter text' } };
    updatePatrolFilter(update)(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ payload: update, type: UPDATE_PATROL_FILTER });
  });

  test('setDefaultDateRange creates the UPDATE_PATROL_FILTER action and updates the INITIAL_FILTER_STATE', () => {
    const lower = generateDaysAgoDate(5).toISOString();
    const upper = null;

    const action = setDefaultDateRange(lower, upper);

    expect(action).toEqual({ payload: { filter: { date_range: { lower, upper } } }, type: UPDATE_PATROL_FILTER });
    expect(INITIAL_FILTER_STATE.filter.date_range.lower).toBe(lower);
    expect(INITIAL_FILTER_STATE.filter.date_range.upper).toBe(upper);
  });

  describe('persistenceConfig', () => {
    test('sets the overlap mode on a filter stored at the default date range, keeping the rest of it', async () => {
      const storedState = {
        _persist: { rehydrated: false, version: -1 },
        filter: { ...INITIAL_FILTER_STATE.filter, patrol_type: ['1'], patrols_overlap_daterange: false },
        status: ['active'],
      };

      const migratedState = await persistenceConfig.migrate(storedState, persistenceConfig.version);

      expect(migratedState).toEqual({
        ...storedState,
        filter: { ...storedState.filter, patrols_overlap_daterange: true },
      });
    });

    test('keeps the start date mode of a filter stored at a custom date range', async () => {
      const storedState = {
        _persist: { rehydrated: false, version: -1 },
        filter: {
          ...INITIAL_FILTER_STATE.filter,
          date_range: { lower: '2026-01-01T00:00:00.000Z', upper: '2026-02-01T00:00:00.000Z' },
          patrols_overlap_daterange: false,
        },
        status: [],
      };

      const migratedState = await persistenceConfig.migrate(storedState, persistenceConfig.version);

      expect(migratedState.filter.patrols_overlap_daterange).toBe(false);
      expect(migratedState.filter.date_range).toEqual(storedState.filter.date_range);
    });

    test('keeps a date filter mode stored since the migration', async () => {
      const storedState = {
        _persist: { rehydrated: false, version: persistenceConfig.version },
        filter: { ...INITIAL_FILTER_STATE.filter, patrols_overlap_daterange: false },
        status: [],
      };

      expect(await persistenceConfig.migrate(storedState, persistenceConfig.version)).toEqual(storedState);
    });
  });
});
