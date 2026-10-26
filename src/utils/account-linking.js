import axios from 'axios';

import { API_URL } from '../constants';
import { getIsValidWebUrl } from './string';

export const ACCOUNT_LINKED_GATE_URL = `${API_URL}user/linked`;

export const GATE_RESULT = {
  LINKED: 'LINKED',       // 204 No Content
  UNLINKED: 'UNLINKED',   // 200 + text/plain link URL in body
  INVALID: 'INVALID',     // 400 Bad Request (token unusable)
  TRANSIENT: 'TRANSIENT', // network error / 5xx / timeout / cancellation
};

// Consult the gate after an Auth0 round-trip and classify the response. The JWT
// is attached per-call (the shared Authorization header isn't installed yet),
// and skipAuth keeps the request off RequestConfigManager's global 401 recovery.
export const checkAccountLinked = async (accessToken) => {
  try {
    const response = await axios.get(ACCOUNT_LINKED_GATE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      skipAuth: true,
    });

    if (response.status === 204) {
      return { result: GATE_RESULT.LINKED };
    }

    // 200 carries the link URL as a bare text/plain string. Only a valid
    // http(s) URL is a usable hand-off target; anything else fails safe.
    if (response.status === 200) {
      const linkUrl = String(response.data ?? '').trim();
      if (getIsValidWebUrl(linkUrl)) {
        return { result: GATE_RESULT.UNLINKED, linkUrl };
      }
    }

    return { result: GATE_RESULT.TRANSIENT };
  } catch (error) {
    if (error?.response?.status === 400) {
      return { result: GATE_RESULT.INVALID };
    }
    return { result: GATE_RESULT.TRANSIENT };
  }
};
