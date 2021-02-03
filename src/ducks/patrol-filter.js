import { endOfToday, startOfToday } from '../utils/datetime';
import globalDateRangeReducerWithDefaultConfig, { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from './global-date-range';

const defaultDateRange = {
  lower: startOfToday().toISOString(),
  upper: endOfToday().toISOString(),
};

const dateRangeReducer = globalDateRangeReducerWithDefaultConfig(
  defaultDateRange
);
  
// ACTIONS
const UPDATE_PATROL_FILTER = 'UPDATE_PATROL_FILTER';
const RESET_PATROL_FILTER = 'RESET_PAROL_FILTER';
const ALLOW_PATROL_FILTER_OVERLAP = 'ALLOW_PATROL_FILTER_OVERLAP';

// ACTION CREATORS
export const updatePatrolFilter = (update) => (dispatch) => {
  dispatch({
    type: UPDATE_PATROL_FILTER,
    payload: update,
  });
};

export const setPatrolFilterAllowsOverlap = (update) => (dispatch) => {
  dispatch({
    type: ALLOW_PATROL_FILTER_OVERLAP,
    payload: update,
  });
};

// REDUCER
export const INITIAL_FILTER_STATE = {
  //status: ['active', 'done', 'cancelled'], /* FPO - as per designs */
  filter: {
    date_range: defaultDateRange,
    overlap: false,
    // patrol_type: [],
    // text: '',
    // leader: [],
  },
};

const patrolFilterReducer = (state = INITIAL_FILTER_STATE, action) => {
  const { type, payload } = action;

  if (type === UPDATE_PATROL_FILTER) {
    return {
      ...state,
      ...payload,
      filter: {
        ...state.filter,
        ...payload.filter,
      },
    };
  }

  if (type === UPDATE_DATE_RANGE || type === RESET_DATE_RANGE) {
    return {
      ...state,
      filter: {
        ...state.filter,
        filter_: dateRangeReducer(state, action),
      },
    };
  }

  if (type === ALLOW_PATROL_FILTER_OVERLAP)
    return {
      ...state,
      filter: {
        ...state.filter,
        overlap: payload,
      },
    };

  if (type === RESET_PATROL_FILTER) {
    return { ...payload };
  }

  return state;
};

export default patrolFilterReducer;