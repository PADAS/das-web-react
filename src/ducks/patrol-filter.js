import { endOfToday, startOfToday } from '../utils/datetime';
import merge from 'lodash/merge';
  
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
    date_range: {
      lower: startOfToday().toISOString(),
      upper: null,
    },
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

  if (type === RESET_PATROL_FILTER) {
    return { ...payload };
  }

  return state;
};

export default patrolFilterReducer;