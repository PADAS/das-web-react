import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { POST_AUTH_SUCCESS } from '../ducks/auth';

const Auth0TokenManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const existingToken = useSelector((state) => state.data.token?.access_token);
  const requireIdp = useSelector((state) => !!state.view.systemConfig?.require_idp);

  useEffect(() => {
    const ensureIdpToken = async () => {
      if (!requireIdp) return;
      if (!isAuthenticated || existingToken) return;
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          },
        });
        const safe = String(token).trim();
        if (!/^[A-Za-z0-9._-]+$/.test(safe)) {
          console.warn('Auth token format rejected');
          return;
        }
        document.cookie = `token=${safe};path=/`;
        dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });
      } catch (_) {
        // silently ignore; UI will route to login if needed
      }
    };
    ensureIdpToken();
  }, [dispatch, existingToken, getAccessTokenSilently, isAuthenticated, requireIdp]);

  return null;
};

export default Auth0TokenManager;
