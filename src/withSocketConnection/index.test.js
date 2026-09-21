import React from 'react';
import { renderHook, act } from '@testing-library/react';

import useRealTimeImplementation from './useRealTimeImplementation';
import { recoverAuth } from '../utils/auth-recovery';
import { clearAuth } from '../ducks/auth';

jest.mock('socket.io-client', () => ({ __esModule: true, default: jest.fn() }));
// Real parsers; only recoverAuth is stubbed.
jest.mock('../utils/auth-recovery', () => ({
  ...jest.requireActual('../utils/auth-recovery'),
  recoverAuth: jest.fn(),
}));
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

  test('a 401 carrying the RFC 9470 step-up challenge routes to interactive step-up, not silent-renew', async () => {
    // Step-up never settles (redirect); assert the routing decision, not a completion.
    recoverAuth.mockReturnValue(new Promise(() => {}));
    const challenge = 'Bearer error="insufficient_user_authentication", acr_values="http://schemas.openid.net/pape/policies/2007/06/multi-factor", max_age="31536000"';

    const { socket, store } = bindSocket();
    await act(async () => {
      socket.handlers.resp_authorization({ status: { code: 401, www_authenticate: challenge } });
      await Promise.resolve();
    });

    expect(recoverAuth).toHaveBeenCalledWith({
      stepUp: true,
      challenge: {
        error: 'insufficient_user_authentication',
        acrValues: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
        maxAge: '31536000',
      },
    });
    expect(clearAuth).not.toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalledWith(CLEAR_AUTH_ACTION);
  });

  test('a 401 with an ordinary (non-step-up) challenge still takes the silent-renew path', async () => {
    recoverAuth.mockResolvedValue('fresh.token');

    const { socket } = bindSocket();
    await act(async () => {
      await socket.handlers.resp_authorization({
        status: { code: 401, www_authenticate: 'Bearer error="invalid_token"' },
      });
    });

    expect(recoverAuth).toHaveBeenCalledWith(undefined);
    expect(clearAuth).not.toHaveBeenCalled();
  });

  test('escalates to step-up (not sign-out) when a silently-renewed socket then 401s with a step-up challenge', async () => {
    const { socket, store } = bindSocket();

    // Ordinary 401 → silent renew → re-authorize (sets the once-per-cycle guard).
    recoverAuth.mockResolvedValueOnce('renewed.token');
    await act(async () => {
      await socket.handlers.resp_authorization({ status: { code: 401 } });
    });

    // The re-authorize 401s with a step-up challenge (guard already set); step-up bypasses it.
    recoverAuth.mockReturnValue(new Promise(() => {}));
    const challenge = 'Bearer error="insufficient_user_authentication", acr_values="urn:mfa", max_age="3600"';
    await act(async () => {
      socket.handlers.resp_authorization({ status: { code: 401, www_authenticate: challenge } });
      await Promise.resolve();
    });

    expect(recoverAuth).toHaveBeenLastCalledWith({
      stepUp: true,
      challenge: { error: 'insufficient_user_authentication', acrValues: 'urn:mfa', maxAge: '3600' },
    });
    expect(clearAuth).not.toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalledWith(CLEAR_AUTH_ACTION);
  });
});
