import {
  recoverAuth,
  registerAuthRecovery,
  __resetAuthRecoveryForTests,
} from './auth-recovery';
import store from '../store';
import { applyAccessToken } from '../ducks/auth';

jest.mock('../store', () => ({ __esModule: true, default: { dispatch: jest.fn() } }));
jest.mock('../ducks/auth', () => ({
  applyAccessToken: jest.fn((token) => ({ type: 'APPLY_ACCESS_TOKEN', token })),
}));

describe('auth-recovery', () => {
  beforeEach(() => {
    __resetAuthRecoveryForTests();
    applyAccessToken.mockImplementation((token) => ({ type: 'APPLY_ACCESS_TOKEN', token }));
  });

  test('silent-renews, applies the token once via applyAccessToken, and returns it', async () => {
    const silentRenew = jest.fn().mockResolvedValue('fresh.token');
    registerAuthRecovery({ silentRenew });

    const token = await recoverAuth();

    expect(silentRenew).toHaveBeenCalledTimes(1);
    expect(token).toBe('fresh.token');
    expect(applyAccessToken).toHaveBeenCalledWith('fresh.token');
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'APPLY_ACCESS_TOKEN', token: 'fresh.token' });
  });

  test('is single-flight: concurrent callers share one renewal and resolve to the same token', async () => {
    let resolveRenew;
    const silentRenew = jest.fn(() => new Promise((resolve) => { resolveRenew = resolve; }));
    registerAuthRecovery({ silentRenew });

    const first = recoverAuth();
    const second = recoverAuth();

    expect(silentRenew).toHaveBeenCalledTimes(1);

    resolveRenew('fresh.token');

    await expect(first).resolves.toBe('fresh.token');
    await expect(second).resolves.toBe('fresh.token');
    expect(store.dispatch).toHaveBeenCalledTimes(1);
  });

  test('resets after settling so a later expiry renews again', async () => {
    const silentRenew = jest.fn().mockResolvedValue('fresh.token');
    registerAuthRecovery({ silentRenew });

    await recoverAuth();
    await recoverAuth();

    expect(silentRenew).toHaveBeenCalledTimes(2);
  });

  test('rejects and does not apply a token when no silentRenew primitive is registered', async () => {
    await expect(recoverAuth()).rejects.toThrow(/silentRenew/);
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  test('rejects without applying a token when renewal throws', async () => {
    const silentRenew = jest.fn().mockRejectedValue(new Error('login_required'));
    registerAuthRecovery({ silentRenew });

    await expect(recoverAuth()).rejects.toThrow('login_required');
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  test('rejects without applying a token when renewal resolves to an empty token', async () => {
    const silentRenew = jest.fn().mockResolvedValue(undefined);
    registerAuthRecovery({ silentRenew });

    await expect(recoverAuth()).rejects.toThrow(/no token/);
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  test('step-up seam: routes to the stepUp primitive with the challenge, not silentRenew', async () => {
    const silentRenew = jest.fn().mockResolvedValue('silent.token');
    const stepUp = jest.fn().mockResolvedValue('stepped.token');
    registerAuthRecovery({ silentRenew, stepUp });

    const challenge = 'Bearer error="insufficient_user_authentication"';
    const token = await recoverAuth({ stepUp: true, challenge });

    expect(stepUp).toHaveBeenCalledWith(challenge);
    expect(silentRenew).not.toHaveBeenCalled();
    expect(token).toBe('stepped.token');
  });
});
