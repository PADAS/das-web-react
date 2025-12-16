import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { POST_AUTH_SUCCESS } from '../ducks/auth';

const AuthCallback = () => {
  const { handleRedirectCallback, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const result = await handleRedirectCallback();
        const appState = result?.appState;
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          },
        });
        const safe = String(token).trim();
        if (!/^[A-Za-z0-9._-]+$/.test(safe)) {
          console.warn('Auth token format rejected');
          navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
          return;
        }
        // Persist like legacy flow: cookie + redux state
        document.cookie = `token=${safe};path=/`;
        dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });

        const storedIntended = (() => { try { return localStorage.getItem('er:intended_route'); } catch (_) { return null; } })();
        const rawReturnTo = appState?.returnTo || storedIntended || REACT_APP_ROUTE_PREFIX;
        const returnTo = /\/login\b/.test(rawReturnTo) ? REACT_APP_ROUTE_PREFIX : rawReturnTo;
        try { localStorage.removeItem('er:intended_route'); } catch (_) {}
        navigate(returnTo, { replace: true, state: { comesFromLogin: true } });
      } catch (e) {
        navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
      }
    };
    run();
  }, [dispatch, getAccessTokenSilently, handleRedirectCallback, navigate]);

  return null;
};

export default AuthCallback;
