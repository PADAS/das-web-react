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

  test('fetchSystemStatus', async () => {
    const dispatch = jest.fn();

    await fetchSystemStatus()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ payload: systemStatusConfig, type: FETCH_SYSTEM_STATUS_SUCCESS });
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
