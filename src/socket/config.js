import { SOCKET_HEALTHY_STATUS, SOCKET_UNHEALTHY_STATUS, SOCKET_WARNING_STATUS, SOCKET_SERVICE_STATUS } from '../ducks/system-status';
import { SOCKET_SUBJECT_STATUS, fetchMapSubjects } from '../ducks/subjects';
import { socketEventData, fetchMapEvents } from '../ducks/events';

const SOCKET_DISPATCHES = {
  resp_authorization: [/* 'SOCKET_AUTH_RESPONSE' ,*/ SOCKET_HEALTHY_STATUS],
  connect_error: [/* 'SOCKET_CONNECT_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  disconnect: [/* 'SOCKET_DISCONNECT' ,*/ SOCKET_UNHEALTHY_STATUS],
  error: [/* 'SOCKET_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  new_event: [socketEventData, SOCKET_HEALTHY_STATUS],
  echo_resp: [/* 'SOCKET_PING_RESPONSE' ,*/ SOCKET_HEALTHY_STATUS],
  reconnect_error: [/* 'SOCKET_RECONNECT_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  reconnecting: [/* 'SOCKET_RECONNECTING' ,*/ SOCKET_WARNING_STATUS],
  service_status: [SOCKET_SERVICE_STATUS, SOCKET_HEALTHY_STATUS],
  socket_error: [/* 'SOCKET_WEBSOCKET_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  subject_status: [SOCKET_SUBJECT_STATUS, SOCKET_HEALTHY_STATUS],
  update_event: [socketEventData, SOCKET_HEALTHY_STATUS],
};

export const SOCKET_RECOVERY_DISPATCHES = [fetchMapSubjects, fetchMapEvents];

export { SOCKET_DISPATCHES as events };