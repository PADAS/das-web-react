import axios from 'axios';

import { API_URL } from '../constants';

export const TOKEN_USABILITY_PROBE_URL = `${API_URL}user/me`;

export const TOKEN_RESULT = {
  USABLE: 'USABLE',       // 200 — the API accepts it
  REFUSED: 'REFUSED',     // 401 — issued, but not accepted here
  TRANSIENT: 'TRANSIENT', // network error / 5xx — nothing learned
};

// A token being issued is not the same fact as a token being usable. The site's own
// authorization server issues one whenever the credentials are right, while whether this
// application may present it is enforced later, per request (das/accounts/backends.py). So
// a token is checked against the API before it is adopted, or the app is entered with a
// token every call will reject and the user is bounced back to a login form that just told
// them they succeeded.
//
// Attaching the token per-call and opting out of the global 401 handling is the same
// arrangement checkAccountLinked uses on the Auth0 path: the shared Authorization header is
// not installed until the token is adopted, and without skipAuth this 401 would re-enter
// auth recovery and sign the user out mid-check.
export const checkTokenUsable = async (accessToken) => {
  try {
    await axios.get(TOKEN_USABILITY_PROBE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      skipAuth: true,
    });

    return TOKEN_RESULT.USABLE;
  } catch (error) {
    return error?.response?.status === 401 ? TOKEN_RESULT.REFUSED : TOKEN_RESULT.TRANSIENT;
  }
};
