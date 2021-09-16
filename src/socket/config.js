import { SOCKET_HEALTHY_STATUS, SOCKET_UNHEALTHY_STATUS, SOCKET_WARNING_STATUS, SOCKET_SERVICE_STATUS } from '../ducks/system-status';
import { SOCKET_SUBJECT_STATUS } from '../ducks/subjects';
import { socketUpdatePatrol, socketCreatePatrol, socketDeletePatrol } from '../ducks/patrols';
import { refreshTrackOnBulkObservationUpdateIfNecessary } from '../ducks/tracks';
import { updateMessageFromRealtime } from '../ducks/messaging';

const SOCKET_DISPATCHES = {
  resp_authorization: [/* 'SOCKET_AUTH_RESPONSE' ,*/ SOCKET_HEALTHY_STATUS],
  connect_error: [/* 'SOCKET_CONNECT_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  disconnect: [/* 'SOCKET_DISCONNECT' ,*/ SOCKET_UNHEALTHY_STATUS],
  error: [/* 'SOCKET_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  echo_resp: [/* 'SOCKET_PING_RESPONSE' ,*/ SOCKET_HEALTHY_STATUS],
  reconnect_error: [/* 'SOCKET_RECONNECT_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  reconnecting: [/* 'SOCKET_RECONNECTING' ,*/ SOCKET_WARNING_STATUS],
  service_status: [SOCKET_SERVICE_STATUS, SOCKET_HEALTHY_STATUS],
  socket_error: [/* 'SOCKET_WEBSOCKET_ERROR' ,*/ SOCKET_UNHEALTHY_STATUS],
  subject_status: [SOCKET_SUBJECT_STATUS, SOCKET_HEALTHY_STATUS],
  new_patrol: [socketCreatePatrol, SOCKET_HEALTHY_STATUS],
  update_patrol: [socketUpdatePatrol, SOCKET_HEALTHY_STATUS],
  delete_patrol: [socketDeletePatrol, SOCKET_HEALTHY_STATUS],
  subject_track_merge: [refreshTrackOnBulkObservationUpdateIfNecessary],
  message_update: [updateMessageFromRealtime],
};

export { SOCKET_DISPATCHES as events };