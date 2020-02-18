export const getAuthTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('token='));
  return token ? token.replace('token=', '').replace(';', '') : null;
};

export const getTemporaryAccessTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('temporaryAccessToken='));
  return token ? token.replace('temporaryAccessToken=', '').replace(';', '') : null;
};

export const deleteAuthTokenCookie = () => {
  document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};
