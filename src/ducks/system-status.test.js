import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import {
  fetchSystemStatus,
  FETCH_SYSTEM_STATUS_SUCCESS,
  SOCKET_HEALTHY_STATUS,
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