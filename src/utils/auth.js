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
