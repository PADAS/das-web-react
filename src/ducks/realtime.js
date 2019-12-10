const SOCKET_ACTIVITY_RECEIVED = 'SOCKET_ACTIVITY_RECEIVED';
const RESET_SOCKET_ACTIVITY_STATE = 'RESET_SOCKET_ACTIVITY_STATE' ;

export const newSocketActivity = ({ type, mid = 0, timestamp = new Date().toISOString() }) => (dispatch) => {
  dispatch({
    type: SOCKET_ACTIVITY_RECEIVED,
    payload: {
      type, mid, timestamp,
    },
  });
};

export const resetSocketActivityState = () => ({
  type: RESET_SOCKET_ACTIVITY_STATE,
});

const INITIAL_ACTIVITY_STATE = {
  updates: {},
};

const socketActivityReducer = (state = INITIAL_ACTIVITY_STATE, action) => {
  const { type, payload } = action;
  if (type === SOCKET_ACTIVITY_RECEIVED) {
    const { type, mid, timestamp } = payload;
    return {
      ...state,
      [type]: { mid, timestamp },
    };
  }
  if (type === RESET_SOCKET_ACTIVITY_STATE) {
    return INITIAL_ACTIVITY_STATE;
  }
  return state;
};

export default socketActivityReducer;