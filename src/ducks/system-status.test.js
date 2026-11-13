import axios from 'axios';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import systemStatusReducer, {
  fetchSystemStatus,
  FETCH_SYSTEM_STATUS_SUCCESS,
  SOCKET_HEALTHY_STATUS,
  SOCKET_SERVICE_STATUS,
  SOCKET_UNHEALTHY_STATUS,
  SOCKET_WARNING_STATUS,
  STATUS_API_URL,
  updateSocketHealthStatus,
} from './system-status';
import { mockStore } from '../__test-helpers/MockStore';
import { SET_SYSTEM_CONFIG, setSystemConfigFromSystemStatus } from './system-config';

jest.mock('./system-config', () => ({
  ...jest.requireActual('./system-config'),
  setSystemConfigFromSystemStatus: jest.fn(() => () => {}),
}));

const systemStatusConfig = {
  alerts_enabled: true,
  default_event_filter_from_days: 15,
};

const server = setupServer(
  http.get(STATUS_API_URL, () => {
    return HttpResponse.json({ data: systemStatusConfig });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('updating socket health status', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ data: { systemStatus: { realtime: { status: null, timestamp: null } } } });
  });

  test('immediately dispatching with a healthy status', () => {
    store.dispatch(updateSocketHealthStatus(SOCKET_HEALTHY_STATUS));

    const actions = store.getActions();
    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_HEALTHY_STATUS,
    }));
  });

  test('dispatching with an unhealthy status after a timeout', () => {
    jest.useFakeTimers();

    store.dispatch(updateSocketHealthStatus(SOCKET_UNHEALTHY_STATUS));

    let actions = store.getActions();

    expect(actions.length).toBe(0);

    jest.runAllTimers();

    actions = store.getActions();

    expect(actions.length).toBe(1);

    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_UNHEALTHY_STATUS,
    }));

    jest.useRealTimers();
  });

  test('dispatching with a warning status after a timeout', () => {
    jest.useFakeTimers();

    store.dispatch(updateSocketHealthStatus(SOCKET_WARNING_STATUS));

    let actions = store.getActions();

    expect(actions.length).toBe(0);

    jest.runAllTimers();

    actions = store.getActions();

    expect(actions.length).toBe(1);

    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_WARNING_STATUS,
    }));

    jest.useRealTimers();
  });

  test('not dispatching unhealthy statuses if a healthy status follows before the timeout fires', () => {
    jest.useFakeTimers();

    store.dispatch(updateSocketHealthStatus(SOCKET_UNHEALTHY_STATUS));

    let actions = store.getActions();

    expect(actions.length).toBe(0);

    store.dispatch(updateSocketHealthStatus(SOCKET_HEALTHY_STATUS));

    jest.runAllTimers();

    actions = store.getActions();

    expect(actions.length).toBe(1);

    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_HEALTHY_STATUS,
    }));

    jest.useRealTimers();
  });

});

describe('fetchSystemStatus', () => {
  const signedIn = (accessToken = 'user.jwt.token') => () => ({ data: { token: { access_token: accessToken } } });

  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    delete axios.defaults.headers.common.Authorization;
  });

  test('dispatches the status and returns it', async () => {
    const dispatch = jest.fn();

    await expect(fetchSystemStatus()(dispatch, signedIn())).resolves.toEqual(systemStatusConfig);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ payload: systemStatusConfig, type: FETCH_SYSTEM_STATUS_SUCCESS });
  });

  test('applies the user config from a signed-in request', async () => {
    const dispatch = jest.fn();

    await fetchSystemStatus()(dispatch, signedIn());

    expect(setSystemConfigFromSystemStatus).toHaveBeenCalledWith(systemStatusConfig, { includeUserConfig: true });
  });

  test('sends no login token and skips the user config on an anonymous request', async () => {
    let authorization = 'not checked';
    server.use(http.get(STATUS_API_URL, ({ request }) => {
      authorization = request.headers.get('authorization');
      return HttpResponse.json({ data: systemStatusConfig });
    }));
    axios.defaults.headers.common.Authorization = 'Bearer user.jwt.token';

    await fetchSystemStatus({ anonymous: true })(jest.fn(), signedIn());

    expect(authorization).toBeNull();
    expect(setSystemConfigFromSystemStatus).toHaveBeenCalledWith(systemStatusConfig, { includeUserConfig: false });
  });

  test('skips the user config when the user signed out before the response', async () => {
    const getState = jest.fn()
      .mockReturnValueOnce({ data: { token: { access_token: 'user.jwt.token' } } })
      .mockReturnValue({ data: { token: null } });

    await fetchSystemStatus()(jest.fn(), getState);

    expect(setSystemConfigFromSystemStatus).toHaveBeenCalledWith(systemStatusConfig, { includeUserConfig: false });
  });

  test('warns with the status code and rejects when the request fails', async () => {
    server.use(http.get(STATUS_API_URL, () => new HttpResponse(null, { status: 500 })));
    const dispatch = jest.fn();

    await expect(fetchSystemStatus()(dispatch, signedIn())).rejects.toThrow();

    expect(warnSpy).toHaveBeenCalledWith('Failed to fetch the system status', 500, expect.any(String));
    expect(dispatch).toHaveBeenCalledWith({ payload: { userConfigLoaded: true }, type: SET_SYSTEM_CONFIG });
  });

  test('does not mark the user config loaded when an anonymous request fails', async () => {
    server.use(http.get(STATUS_API_URL, () => new HttpResponse(null, { status: 500 })));
    const dispatch = jest.fn();

    await expect(fetchSystemStatus({ anonymous: true })(dispatch, signedIn())).rejects.toThrow();

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: SET_SYSTEM_CONFIG }));
  });
});

describe('service status', () => {
  const createService = (heartbeatLatestAt, datasourceLatestAt) => ({
    datasource: { latest_at: datasourceLatestAt, title: 'Datasource' },
    display_name: 'Collars',
    heartbeat: { latest_at: heartbeatLatestAt, title: 'Heartbeat' },
    provider_key: 'collars',
    status_code: 'OK',
  });

  const reduceServices = (services) => systemStatusReducer(
    undefined,
    { payload: { services }, type: SOCKET_SERVICE_STATUS }
  ).services;

  test('parses the heartbeat and datasource timestamps of a service', () => {
    const [service] = reduceServices([createService('2026-09-30T10:00:00Z', '2026-09-30T09:00:00Z')]);

    expect(service.heartbeat.timestamp).toEqual(new Date('2026-09-30T10:00:00Z'));
    expect(service.datasource.timestamp).toEqual(new Date('2026-09-30T09:00:00Z'));
  });

  test('leaves the timestamps of a service null when the server does not send them', () => {
    const [service] = reduceServices([createService(null, undefined)]);

    expect(service.heartbeat.timestamp).toBeNull();
    expect(service.datasource.timestamp).toBeNull();
  });
});
