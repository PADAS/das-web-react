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

// A rejected connection comes back from Auth0 as URL params after a full
// redirect, by which point nothing on the page says which button started the
// login. Marking the attempt is what lets the callback attribute a failure to
// the local-user path instead of blaming the common one.
export const markLocalUserLoginAttempt = () => {
  try {
    sessionStorage.setItem(LOCAL_USER_LOGIN_ATTEMPT_KEY, 'true');
  } catch (_) {
    // Ignore errors
  }
};

// Reads and clears together: the marker describes a single attempt, so leaving
// it behind would misattribute the next failure on the common path.
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

// Set when a local user authenticates but this site has no account mapped to
// them. Signing them out of Auth0 is what makes that state safe, and the logout
// redirect leaves the app — so the reason for it has to survive the round trip
// somewhere other than the router.
export const markLocalUserNotProvisioned = () => {
  try {
    sessionStorage.setItem(LOCAL_USER_NOT_PROVISIONED_KEY, 'true');
  } catch (_) {
    // Ignore errors
  }
};

// Carries only the message, never the protection: losing this flag costs the
// user an explanation, not their sign-out.
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
