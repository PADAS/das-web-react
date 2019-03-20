const SOCKET_DISPATCHES = {
  SOCKET_AUTH_RESPONSE: 'resp_authorization',
  SOCKET_CONNECT: 'connect',
  SOCKET_CONNECT_ERROR: 'connect_error',
  SOCKET_DISCONNECT: 'disconnect',
  SOCKET_ERROR: 'error',
  SOCKET_NEW_EVENT: 'new_event',
  SOCKET_PING_RESPONSE: 'echo_resp',
  SOCKET_RECONNECT_ERROR: 'reconnect_error',
  SOCKET_RECONNECTING: 'reconnecting',
  SOCKET_SERVICE_STATUS: 'service_status',
  SOCKET_WEBSOCKET_ERROR: 'socket_error',
  SOCKET_SUBJECT_STATUS: 'subject_status',
  SOCKET_UPDATE_EVENT: 'update_event',
};

export { SOCKET_DISPATCHES as events };