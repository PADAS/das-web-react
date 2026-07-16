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

// A stalled silent renewal (e.g. a network black-hole) must not hang recovery for both
// transports, so it is time-boxed. Interactive step-up is deliberately NOT bounded — it
// waits on the user completing MFA, which can take far longer than any network timeout.
const SILENT_RENEW_TIMEOUT_MS = 30_000;

const withTimeout = async (promise, ms) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('auth-recovery: renewal timed out')), ms);
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

      const accessToken = stepUp
        ? await recover(challenge)
        : await withTimeout(recover(challenge), SILENT_RENEW_TIMEOUT_MS);
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
