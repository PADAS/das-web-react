export const getAuthTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('token='));
  return token ? token.replace('token=', '').replace(';', '') : null;
};

export const getTemporaryAccessTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('temporaryAccessToken='));
  return token ? token.replace('temporaryAccessToken=', '').replace(';', '') : null;
};
export const deleteCookie = (name) => document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;

export const deleteAuthTokenCookie = () => deleteCookie('token');

export const deleteTemporaryAccessTokenCookie = () => deleteCookie('temporaryAccessToken');

export const isValidTokenFormat = (token) => {
  if (!token) return false;
  return /^[A-Za-z0-9._-]+$/.test(token);
};

export const getIntendedPostAuth0SuccessRoute = () => {
  try {
    return localStorage.getItem('er:intended_route');
  } catch (_) {
    return null;
  }
};

export const clearIntendedPostAuth0SuccessRoute = () => {
  try {
    localStorage.removeItem('er:intended_route');
  } catch (_) {
    // Ignore errors
  }
};

export const setIntendedPostAuth0SuccessRoute = (route) => {
  try {
    localStorage.setItem('er:intended_route', route);
  } catch (_) {
    // Ignore errors
  }
};

const LOCAL_USER_LOGIN_ATTEMPT_KEY = 'er:local_user_login_attempt';

// Auth0 reports failures after a full redirect, by which point nothing on the page
// says which button started the login. This is how the callback knows.
export const markLocalUserLoginAttempt = () => {
  try {
    sessionStorage.setItem(LOCAL_USER_LOGIN_ATTEMPT_KEY, 'true');
  } catch (_) {
    // Ignore errors
  }
};

// Reads and clears together — the marker describes one attempt.
export const takeLocalUserLoginAttempt = () => {
  try {
    const attempted = sessionStorage.getItem(LOCAL_USER_LOGIN_ATTEMPT_KEY) === 'true';
    sessionStorage.removeItem(LOCAL_USER_LOGIN_ATTEMPT_KEY);
    return attempted;
  } catch (_) {
    return false;
  }
};

const LOCAL_USER_NOT_PROVISIONED_KEY = 'er:local_user_not_provisioned';

// Set when a local user has no ER account here. The logout redirect that follows
// leaves the app, so the reason cannot ride router state.
export const markLocalUserNotProvisioned = () => {
  try {
    sessionStorage.setItem(LOCAL_USER_NOT_PROVISIONED_KEY, 'true');
  } catch (_) {
    // Ignore errors
  }
};

// Carries the message, not the protection: losing it costs an explanation.
export const takeLocalUserNotProvisioned = () => {
  try {
    const notProvisioned = sessionStorage.getItem(LOCAL_USER_NOT_PROVISIONED_KEY) === 'true';
    sessionStorage.removeItem(LOCAL_USER_NOT_PROVISIONED_KEY);
    return notProvisioned;
  } catch (_) {
    return false;
  }
};

export const stripAuth0Params = (url) => {
  const [pathname, searchString] = url.split('?');
  if (!searchString) return pathname;

  const params = new URLSearchParams(searchString);
  params.delete('code');
  params.delete('state');
  params.delete('error');
  params.delete('error_description');

  const remaining = params.toString();
  return remaining ? `${pathname}?${remaining}` : pathname;
};

export const isSystemConfigLoaded = (systemConfig) => {
  return systemConfig.require_idp !== null;
};
