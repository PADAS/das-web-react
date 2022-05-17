import { mockStore } from '../__test-helpers/MockStore';

import { updateSocketHealthStatus, SOCKET_HEALTHY_STATUS, SOCKET_UNHEALTHY_STATUS, SOCKET_WARNING_STATUS } from './system-status';

describe('updating socket health status', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ data: { systemStatus: { realtime: { status: null, timestamp: null } } } });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('immediately dispatching with a healthy status', () => {
    store.dispatch(updateSocketHealthStatus(SOCKET_HEALTHY_STATUS));

    const actions = store.getActions();
    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_HEALTHY_STATUS,
    }));
  });

  test('dispatching with an unhealthy status after a timeout', () => {
    store.dispatch(updateSocketHealthStatus(SOCKET_UNHEALTHY_STATUS));

    let actions = store.getActions();

    expect(actions.length).toBe(0);

    jest.runAllTimers();

    actions = store.getActions();

    expect(actions.length).toBe(1);

    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_UNHEALTHY_STATUS,
    }));
  });

  test('dispatching with a warning status after a timeout', () => {
    store.dispatch(updateSocketHealthStatus(SOCKET_WARNING_STATUS));

    let actions = store.getActions();

    expect(actions.length).toBe(0);

    jest.runAllTimers();

    actions = store.getActions();

    expect(actions.length).toBe(1);

    expect(actions[0]).toEqual(expect.objectContaining({
      type: SOCKET_WARNING_STATUS,
    }));
  });

  test('not dispatching unhealthy statuses if a healthy status follows before the timeout fires', () => {
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
  });
});