import { getAuthTokenFromCookies } from './auth';
import { ECOSCOPE_ENABLED, REACT_APP_ECOSCOPE_API_URL, REACT_APP_ECOSCOPE_SITE_ID } from '../constants';

export const ECOSCOPE_CONNECTION_KEY = 'er:ecoscope_connection';
export const ECOSCOPE_LOGOUT_EVENT = 'er:ecoscope_logout';
const ECOSCOPE_LOGOUT_KEY = 'er:ecoscope_logged_out';

export const clearEcoscopeConnection = (shouldBlockLaunch = true) => {
  if (!ECOSCOPE_ENABLED) return;
  if (shouldBlockLaunch) {
    localStorage.setItem(ECOSCOPE_LOGOUT_KEY, 'true');
  } else {
    localStorage.removeItem(ECOSCOPE_LOGOUT_KEY);
  }
  localStorage.removeItem(ECOSCOPE_CONNECTION_KEY);
  window.dispatchEvent(new Event(ECOSCOPE_LOGOUT_EVENT));
};

export const requestEcoscopeLaunch = (accessToken, signal) =>
  navigator.locks.request(ECOSCOPE_CONNECTION_KEY, { signal }, async () => {
    if (signal.aborted
      || localStorage.getItem(ECOSCOPE_LOGOUT_KEY)
      || getAuthTokenFromCookies() !== accessToken) {
      throw new Error('EarthRanger connection ended');
    }
    let connectionId = localStorage.getItem(ECOSCOPE_CONNECTION_KEY);
    if (!connectionId) {
      connectionId = crypto.randomUUID();
      localStorage.setItem(ECOSCOPE_CONNECTION_KEY, connectionId);
    }
    const response = await fetch(`${REACT_APP_ECOSCOPE_API_URL}/v1/integrations/earthranger/launch`, {
      body: JSON.stringify({ connection_id: connectionId, site_id: REACT_APP_ECOSCOPE_SITE_ID }),
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      method: 'POST',
      signal,
    });
    if (!response.ok) throw new Error('Ecoscope launch failed');
    return response.json();
  });

export const revokeEcoscopeConnection = async (accessToken) => {
  if (ECOSCOPE_ENABLED) {
    await navigator.locks.request(ECOSCOPE_CONNECTION_KEY, async () => {
      const connectionId = localStorage.getItem(ECOSCOPE_CONNECTION_KEY);
      if (connectionId) {
        const response = await fetch(`${REACT_APP_ECOSCOPE_API_URL}/v1/integrations/earthranger/logout`, {
          body: JSON.stringify({ connection_id: connectionId, site_id: REACT_APP_ECOSCOPE_SITE_ID }),
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          method: 'POST',
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error('Ecoscope logout failed');
      }
      clearEcoscopeConnection();
    });
  }
};
