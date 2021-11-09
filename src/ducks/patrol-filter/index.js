import { endOfToday, startOfToday } from '../../utils/datetime';
import globalDateRangeReducerWithDefaultConfig, { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from '../global-date-range';

const defaultDateRange = {
  lower: startOfToday().toISOString(),
  upper: endOfToday().toISOString(),
};

const dateRangeReducer = globalDateRangeReducerWithDefaultConfig(defaultDateRange);

// ACTIONS
export const UPDATE_PATROL_FILTER = 'UPDATE_PATROL_FILTER';

// ACTION CREATORS
export const updatePatrolFilter = (update) => (dispatch) => {
  dispatch({ type: UPDATE_PATROL_FILTER, payload: update });
};

// REDUCER
export const INITIAL_FILTER_STATE = {
  //status: ['active', 'done', 'cancelled'], /* FPO - as per designs */
  filter: {
    date_range: defaultDateRange,
    patrols_overlap_daterange: false,
    // patrol_type: [],
    text: '',
    leader: null,
  },
};

const patrolFilterReducer = (state = INITIAL_FILTER_STATE, action) => {
  switch (action.type) {
  case UPDATE_PATROL_FILTER:
    return {
      ...state,
      ...action.payload,
      filter: {
        ...state.filter,
        ...action.payload.filter,
      },
    };

  case UPDATE_DATE_RANGE:
  case RESET_DATE_RANGE:
    return {
      ...state,
      filter: {
        ...state.filter,
        date_range: dateRangeReducer(state, action),
      },
    };

  default:
    return state;
  }
};

export default patrolFilterReducer;
