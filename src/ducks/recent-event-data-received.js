import { SOCKET_EVENT_DATA } from './events';

const INITIAL_STATE = { data: null };
const recentEventDataReceivedReducer = (state = INITIAL_STATE, { type, payload }) => {
  if (type !== SOCKET_EVENT_DATA) return state;


  return { data: payload.event_data };
};

export default recentEventDataReceivedReducer;