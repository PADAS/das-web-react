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

// The authorization server resolved for the login attempt now in flight, carried across the
// Auth0 redirect the same way the intended route is. sessionStorage rather than localStorage
// scopes it to one tab and one attempt; the redirect is a same-tab top-level navigation, so it
// survives. Only the issuer is stored -- never the client registration it resolves to.
const RESOLVED_ISSUER_KEY = 'er:resolved_issuer';

export const setResolvedIssuer = (issuer) => {
  try {
    sessionStorage.setItem(RESOLVED_ISSUER_KEY, issuer);
  } catch (_) {
    // Ignore errors
  }
};

export const getResolvedIssuer = () => {
  try {
    return sessionStorage.getItem(RESOLVED_ISSUER_KEY);
  } catch (_) {
    return null;
  }
};

export const clearResolvedIssuer = () => {
  try {
    sessionStorage.removeItem(RESOLVED_ISSUER_KEY);
  } catch (_) {
    // Ignore errors
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

// Set once a status response has been ingested. This used to be inferred from require_idp
// being non-null, which quietly coupled the startup gate to a field that is on its way out.
export const isSystemConfigLoaded = (systemConfig) => !!systemConfig.loaded;
