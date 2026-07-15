import React from 'react';
import { renderHook, act } from '@testing-library/react';

import useRealTimeImplementation from './useRealTimeImplementation';
import { recoverAuth } from '../utils/auth-recovery';
import { clearAuth } from '../ducks/auth';

jest.mock('socket.io-client', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../utils/auth-recovery', () => ({ recoverAuth: jest.fn() }));
jest.mock('../ducks/auth', () => ({ clearAuth: jest.fn() }));
// The socket handler dispatches through the imported store singleton; stub it so the
// test controls dispatch and importing the hook doesn't build the real reducer tree.
jest.mock('../store', () => ({
  __esModule: true,
  default: { dispatch: jest.fn(), getState: () => ({ data: {} }) },
}));
// implementations/latest + the filter utils only run on the authorized (200) path;
// stub them so exercising that path doesn't need a full socket/store.
jest.mock('./useRealTimeImplementation/implementations/latest', () => ({
  eventsBounding: jest.fn(),
  errorHandlersBounding: jest.fn(),
}));
jest.mock('../utils/event-filter', () => ({ calcEventFilterForRequest: () => ({}) }));
jest.mock('../utils/patrol-filter', () => ({ calcPatrolFilterForRequest: () => ({}) }));

describe('initializing the web socket', () => {
  test('binding socket events', () => {});
});

describe('recreating the web socket', () => {
  test('tearing down the old web socket for failure cases', () => {});

  test('creating the new web socket', () => {});
});

const CLEAR_AUTH_ACTION = { type: 'CLEAR_AUTH' };

const makeSocket = () => {
  const handlers = {};
  return {
    on: jest.fn((event, fn) => { handlers[event] = fn; }),
    emit: jest.fn(),
    handlers,
  };
};

const makeStore = (accessToken = 'fresh.token') => {
  let token = accessToken;
  return {
    dispatch: jest.fn(),
    getState: () => ({ data: { token: { access_token: token }, selectedUserProfile: null } }),
    setToken: (next) => { token = next; },
  };
};

const bindSocket = (accessToken) => {
  const { result } = renderHook(() => useRealTimeImplementation());
  const socket = makeSocket();
  const store = makeStore(accessToken);
  result.current.bindSocketEvents(socket, store);
  return { socket, store };
};

describe('websocket auth recovery (resp_authorization)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearAuth.mockReturnValue(CLEAR_AUTH_ACTION);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('a 401 silently renews and re-authorizes on the same socket, without signing out', async () => {
    // Start with a stale token and have recoverAuth model applyAccessToken updating the
    // store, so asserting 'Bearer fresh.token' proves the socket re-authorized with the
    // RENEWED token — not the pre-existing one.
    const { socket, store } = bindSocket('stale.token');
    recoverAuth.mockImplementation(async () => {
      store.setToken('fresh.token');
      return 'fresh.token';
    });

    await act(async () => {
      await socket.handlers.resp_authorization({ status: { code: 401 } });
    });

    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith(
      'authorization',
      expect.objectContaining({ authorization: 'Bearer fresh.token' }),
    );
    expect(socket.emit).not.toHaveBeenCalledWith(
      'authorization',
      expect.objectContaining({ authorization: 'Bearer stale.token' }),
    );
    expect(clearAuth).not.toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalledWith(CLEAR_AUTH_ACTION);
  });

  test('signs out when renewal fails', async () => {
    recoverAuth.mockRejectedValue(new Error('login_required'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { socket, store } = bindSocket();
    await act(async () => {
      await socket.handlers.resp_authorization({ status: { code: 401 } });
    });

    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(CLEAR_AUTH_ACTION);
    expect(socket.emit).not.toHaveBeenCalledWith('authorization', expect.anything());

    warnSpy.mockRestore();
  });

  test('renews at most once per cycle: a second 401 without an intervening success signs out', async () => {
    recoverAuth.mockResolvedValue('fresh.token');

    const { socket, store } = bindSocket();
    await act(async () => {
      await socket.handlers.resp_authorization({ status: { code: 401 } });
      await socket.handlers.resp_authorization({ status: { code: 401 } });
    });

    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(CLEAR_AUTH_ACTION);
  });

  test('a successful (200) authorization resets the guard so a later 401 renews again', async () => {
    recoverAuth.mockResolvedValue('fresh.token');

    const { socket } = bindSocket();
    await act(async () => {
      await socket.handlers.resp_authorization({ status: { code: 401 } });
      await socket.handlers.resp_authorization({ status: { code: 200 } });
      await socket.handlers.resp_authorization({ status: { code: 401 } });
    });

    expect(recoverAuth).toHaveBeenCalledTimes(2);
    expect(clearAuth).not.toHaveBeenCalled();
  });
});
