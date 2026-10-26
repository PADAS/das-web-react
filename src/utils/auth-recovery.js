import store from '../store';
import { applyAccessToken } from '../ducks/auth';

/**
 * Shared, single-flight auth recovery, keyed by mode (silent renewal vs interactive
 * step-up). Concurrent same-mode 401s collapse into one in-flight renewal that every
 * caller awaits, and its token is applied once. The two modes run independently, so a
 * step-up never collapses into an in-flight silent renewal (a same-ACR silent token can't
 * satisfy an MFA challenge). Auth0 primitives are injected via `registerAuthRecovery`
 * (they are React-hook-bound), not imported.
 */

const STEP_UP_ERROR = 'insufficient_user_authentication';

// Parse an RFC 9470 Bearer challenge (the WWW-Authenticate header). Assumes a single
// Bearer challenge, which is what ER Server emits.
export const parseAuthChallenge = (challenge) => {
  if (typeof challenge !== 'string') return null;
  const read = (pattern) => challenge.match(pattern)?.[1];
  return {
    error: read(/error="([^"]*)"/),
    acrValues: read(/acr_values="([^"]*)"/),
    maxAge: read(/max_age="([^"]*)"/),
  };
};

export const isStepUpChallenge = (challenge) =>
  parseAuthChallenge(challenge)?.error === STEP_UP_ERROR;

// Time-boxed so a stalled recovery can't hang forever. Step-up's longer bound only trips
// if the redirect never navigated (a real redirect unloads the page first).
const SILENT_RENEW_TIMEOUT_MS = 30_000;
const STEP_UP_REDIRECT_TIMEOUT_MS = 60_000;

const withTimeout = async (promise, ms, label = 'recovery') => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`auth-recovery: ${label} timed out`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

let primitives = { silentRenew: null, stepUp: null };

// In-flight recovery, keyed by mode: a step-up must never collapse into an in-flight
// silent renewal (a silent token is same-ACR and can't satisfy the MFA challenge).
let inFlight = { silent: null, stepUp: null };

export const registerAuthRecovery = (next) => {
  primitives = { ...primitives, ...next };
};

export const recoverAuth = ({ stepUp = false, challenge = null } = {}) => {
  const mode = stepUp ? 'stepUp' : 'silent';
  if (!inFlight[mode]) {
    // Same-mode callers coalesce onto this flight, so the first caller's challenge is used
    // (challenges are identical for a given requirement).
    inFlight[mode] = (async () => {
      const recover = stepUp ? primitives.stepUp : primitives.silentRenew;
      if (typeof recover !== 'function') {
        throw new Error(`auth-recovery: no ${stepUp ? 'stepUp' : 'silentRenew'} primitive registered`);
      }

      const accessToken = await withTimeout(
        recover(challenge),
        stepUp ? STEP_UP_REDIRECT_TIMEOUT_MS : SILENT_RENEW_TIMEOUT_MS,
        stepUp ? 'step-up redirect' : 'silent renewal',
      );
      if (!accessToken) {
        throw new Error('auth-recovery: renewal returned no token');
      }
      store.dispatch(applyAccessToken(accessToken));
      return accessToken;
    })().finally(() => {
      inFlight[mode] = null;
    });
  }
  return inFlight[mode];
};

// Test-only: reset module singletons between cases.
export const __resetAuthRecoveryForTests = () => {
  primitives = { silentRenew: null, stepUp: null };
  inFlight = { silent: null, stepUp: null };
};
