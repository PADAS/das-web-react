import axios from 'axios';

import { API_URL } from '../constants';

export const ACCOUNT_LINKED_GATE_URL = `${API_URL}user/linked`;

export const GATE_RESULT = {
  LINKED: 'LINKED',       // 204 No Content
  UNLINKED: 'UNLINKED',   // 200 + text/plain link URL in body
  INVALID: 'INVALID',     // 400 Bad Request (token unusable)
  TRANSIENT: 'TRANSIENT', // network error / 5xx / timeout / cancellation
};

// A gate hand-off drives a full-page navigation, so only an http(s) URL is a
// usable target. Guards against an unexpected body or a malformed / non-http
// value (e.g. javascript: or data:) ever reaching window.location.
const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch (_error) {
    return false;
  }
};

// Consult the gate after an Auth0 round-trip. Returns a classified result so
// the caller never has to interpret HTTP status codes directly.
//
// The JWT is attached per-call rather than via the shared default Authorization
// header: that header is installed by a RequestConfigManager effect keyed on
// token.access_token, which has not run yet at the gate-call point (the SPA has
// not dispatched POST_AUTH_SUCCESS). skipAuth keeps the gate off the global 401
// recovery in RequestConfigManager — the gate owns its own error handling.
export const checkAccountLinked = async (accessToken) => {
  try {
    const response = await axios.get(ACCOUNT_LINKED_GATE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      skipAuth: true,
    });

    if (response.status === 204) {
      return { result: GATE_RESULT.LINKED };
    }

    // 200 text/plain: Axios's default transformResponse returns the body
    // verbatim when JSON parsing fails on a bare URL, so response.data is the
    // raw string. Only an http(s) URL is a usable hand-off target — an
    // unexpected 2xx, or a 200 whose body isn't a real URL, fails safe to
    // TRANSIENT so the client lands at /login rather than navigating somewhere
    // unexpected.
    if (response.status === 200) {
      const linkUrl = String(response.data ?? '').trim();
      if (isHttpUrl(linkUrl)) {
        return { result: GATE_RESULT.UNLINKED, linkUrl };
      }
    }

    return { result: GATE_RESULT.TRANSIENT };
  } catch (error) {
    if (error?.response?.status === 400) {
      return { result: GATE_RESULT.INVALID };
    }
    // Network error, 5xx, timeout, or an Axios cancellation: transient.
    return { result: GATE_RESULT.TRANSIENT };
  }
};
