import { endOfToday, startOfToday } from '../utils/datetime';
import merge from 'lodash/merge';
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
const RESET_PATROL_FILTER = 'RESET_PATROL_FILTER';

// ACTION CREATORS
export const updatePatrolFilter = (update) => (dispatch) => {
  dispatch({
    type: UPDATE_PATROL_FILTER,
    payload: update,
  });
};

// REDUCER
export const INITIAL_FILTER_STATE = {
  //status: ['active', 'done', 'cancelled'], /* FPO - as per designs */
  filter: {
    date_range: defaultDateRange,
    // patrol_type: [],
    // text: '',
    // leader: [],
  },
};

const patrolFilterReducer = (state = INITIAL_FILTER_STATE, action) => {
  const { type, payload } = action;

  if (type === UPDATE_PATROL_FILTER) {
    return merge({}, state, payload);
  }

  if (type === UPDATE_DATE_RANGE || type === RESET_DATE_RANGE) {
    return merge({}, state, {
      filter: {
        date_range: dateRangeReducer(state, action),
      }
    });
  }

  if (type === RESET_PATROL_FILTER) {
    return { ...payload };
  }

  return state;
};

export default patrolFilterReducer;