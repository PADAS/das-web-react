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

export const isValidTokenFormat = (token = '') => {
  return /^[A-Za-z0-9._-]+$/.test(token);
};

export const getIntendedRoute = () => {
  try {
    return localStorage.getItem('er:intended_route');
  } catch (_) {
    return null;
  }
};

export const clearIntendedRoute = () => {
  try {
    localStorage.removeItem('er:intended_route');
  } catch (_) {
    // Ignore errors
  }
};

export const setIntendedRoute = (route) => {
  try {
    localStorage.setItem('er:intended_route', route);
  } catch (_) {
    // Ignore errors
  }
};

export const stripOAuthParams = (url) => {
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
