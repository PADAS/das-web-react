const SOCKET_ACTIVITY_RECEIVED = 'SOCKET_ACTIVITY_RECEIVED';
const SOCKET_PING_TIMEOUT = 'SOCKET_PING_TIMEOUT';

export const socketPingTimeout = () => ({
  type: SOCKET_PING_TIMEOUT,
});

export const newSocketActivity = ({ type, mid = 0, timestamp = new Date().toISOString() }) => ({
  type: SOCKET_ACTIVITY_RECEIVED,
  payload: {
    type, mid, timestamp,
  },
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
  if (type === SOCKET_PING_TIMEOUT) {
    return INITIAL_ACTIVITY_STATE;
  }
  return state;
};

export default socketActivityReducer;