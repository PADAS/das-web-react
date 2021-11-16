import patrolFilterReducer, { INITIAL_FILTER_STATE, UPDATE_PATROL_FILTER } from './';

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
            patrol_types: ['2', '3'],
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
});
