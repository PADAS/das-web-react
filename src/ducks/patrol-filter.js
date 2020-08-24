import isEqual from 'react-fast-compare';

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
  filter: {
    text: '',
  },
};

const patrolFilterReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
  case (UPDATE_PATROL_FILTER): {
    const updated = {
      ...state, ...payload, filter: {
        ...state.filter,
        ...payload.filter,
      }
    };
    if (isEqual(state, updated)) return state;
    return updated;
  }
  case (RESET_PATROL_FILTER): {
    return { ...payload };
  }
  default: {
    return state;
  }

  }
};

export default patrolFilterReducer;