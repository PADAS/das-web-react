export const authHeaderMiddleware = ({ getState }) => next => action => {
 /*  const token = getState().token.access_token;
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } */
  return next(action);
};
