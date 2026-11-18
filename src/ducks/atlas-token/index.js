import axios from 'axios';

import { CURRENT_USER_API_URL } from '../user';

export const ATLAS_TOKEN_API_URL = `${CURRENT_USER_API_URL}/atlas-token/`;

// Action creators
export const fetchAtlasToken = () => async () => {
  try {
    // Callers handle auth failures, so skip global recovery and sign-out.
    const response = await axios.post(ATLAS_TOKEN_API_URL, undefined, { skipAuth: true });

    return {
      expiresAt: response.data.data.expires_at,
      expiresIn: response.data.data.expires_in,
      token: response.data.data.access_token,
    };
  } catch (error) {
    if (!axios.isCancel(error)) {
      console.warn('Error fetching the Atlas token', error);
    }

    throw error;
  }
};
