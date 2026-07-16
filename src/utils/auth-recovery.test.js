import {
  recoverAuth,
  registerAuthRecovery,
  isStepUpChallenge,
  parseAuthChallenge,
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

  test('times out a stalled silent renewal and clears in-flight so a later call retries', async () => {
    jest.useFakeTimers();
    try {
      const silentRenew = jest.fn(() => new Promise(() => {}));
      registerAuthRecovery({ silentRenew });

      const rejection = expect(recoverAuth()).rejects.toThrow(/timed out/);
      await jest.advanceTimersByTimeAsync(30_000);
      await rejection;

      expect(store.dispatch).not.toHaveBeenCalled();

      silentRenew.mockImplementationOnce(() => Promise.resolve('fresh.token'));
      await expect(recoverAuth()).resolves.toBe('fresh.token');
      expect(silentRenew).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  test('does not time out an interactive step-up (it waits on the user)', async () => {
    jest.useFakeTimers();
    try {
      const stepUp = jest.fn(() => new Promise((resolve) => {
        setTimeout(() => resolve('stepped.token'), 90_000); // past the 30s silent-renewal timeout
      }));
      registerAuthRecovery({ stepUp });

      const pending = recoverAuth({ stepUp: true });
      await jest.advanceTimersByTimeAsync(60_000);
      await jest.advanceTimersByTimeAsync(30_000);
      await expect(pending).resolves.toBe('stepped.token');
    } finally {
      jest.useRealTimers();
    }
  });

  test('a step-up request does not collapse into an in-flight silent renewal', async () => {
    jest.useFakeTimers();
    try {
      let resolveSilent;
      const silentRenew = jest.fn(() => new Promise((resolve) => { resolveSilent = resolve; }));
      const stepUp = jest.fn().mockResolvedValue('stepped.token');
      registerAuthRecovery({ silentRenew, stepUp });

      const silentPending = recoverAuth();
      const stepUpPending = recoverAuth({ stepUp: true, challenge: {} });

      // The step-up must run its own primitive, not join the in-flight silent renewal.
      expect(stepUp).toHaveBeenCalledTimes(1);
      await expect(stepUpPending).resolves.toBe('stepped.token');

      resolveSilent('silent.token');
      await expect(silentPending).resolves.toBe('silent.token');
    } finally {
      jest.useRealTimers();
    }
  });

  test('a silent renewal does not collapse into an in-flight step-up', async () => {
    let resolveStepUp;
    const stepUp = jest.fn(() => new Promise((resolve) => { resolveStepUp = resolve; }));
    const silentRenew = jest.fn().mockResolvedValue('silent.token');
    registerAuthRecovery({ silentRenew, stepUp });

    const stepUpPending = recoverAuth({ stepUp: true, challenge: {} });
    const silentPending = recoverAuth();

    // The silent renewal runs its own primitive, not the in-flight step-up.
    expect(silentRenew).toHaveBeenCalledTimes(1);
    await expect(silentPending).resolves.toBe('silent.token');

    resolveStepUp('stepped.token');
    await expect(stepUpPending).resolves.toBe('stepped.token');
  });

  test('concurrent step-up requests coalesce into a single step-up', async () => {
    let resolveStepUp;
    const stepUp = jest.fn(() => new Promise((resolve) => { resolveStepUp = resolve; }));
    registerAuthRecovery({ stepUp });

    const first = recoverAuth({ stepUp: true, challenge: {} });
    const second = recoverAuth({ stepUp: true, challenge: {} });

    expect(stepUp).toHaveBeenCalledTimes(1);

    resolveStepUp('stepped.token');
    await expect(first).resolves.toBe('stepped.token');
    await expect(second).resolves.toBe('stepped.token');
  });
});

describe('auth-recovery challenge parsing', () => {
  const STEP_UP = 'Bearer error="insufficient_user_authentication", acr_values="http://schemas.openid.net/pape/policies/2007/06/multi-factor", max_age="31536000"';

  describe('isStepUpChallenge', () => {
    test('true for an RFC 9470 insufficient_user_authentication challenge', () => {
      expect(isStepUpChallenge(STEP_UP)).toBe(true);
    });

    test('false for an ordinary Bearer challenge, a different error, or a non-string', () => {
      expect(isStepUpChallenge('Bearer realm="vector-tiles"')).toBe(false);
      expect(isStepUpChallenge('Bearer error="invalid_token"')).toBe(false);
      expect(isStepUpChallenge(undefined)).toBe(false);
      expect(isStepUpChallenge(null)).toBe(false);
    });

    test('false when the phrase appears only in error_description, not the error field', () => {
      expect(isStepUpChallenge(
        'Bearer error="invalid_token", error_description="not insufficient_user_authentication"'
      )).toBe(false);
    });
  });

  describe('parseAuthChallenge', () => {
    test('extracts error, acrValues, and maxAge', () => {
      expect(parseAuthChallenge(STEP_UP)).toEqual({
        error: 'insufficient_user_authentication',
        acrValues: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
        maxAge: '31536000',
      });
    });

    test('leaves absent fields undefined', () => {
      const parsed = parseAuthChallenge('Bearer error="insufficient_user_authentication"');
      expect(parsed.error).toBe('insufficient_user_authentication');
      expect(parsed.acrValues).toBeUndefined();
      expect(parsed.maxAge).toBeUndefined();
    });

    test('returns null for a non-string', () => {
      expect(parseAuthChallenge(undefined)).toBeNull();
    });
  });
});
