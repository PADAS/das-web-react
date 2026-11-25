import { memo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { toast } from 'react-toastify';

import { clearAuth, resetMasterCancelToken } from '../ducks/auth';

import { APP_ROUTES } from '../constants/routes';
import { isStepUpChallenge, parseAuthChallenge, recoverAuth } from '../utils/auth-recovery';
import { selectActiveProfileId, selectSignedInUser } from '../selectors/user';
import { showToast } from '../utils/toast';
import useAuthRecovery from '../hooks/useAuthRecovery';
import useNavigate from '../hooks/useNavigate';

const STARTUP_TIME = new Date();

let warningToastRef;

const handleGeoPermWarningHeader = (response, userLocationAccessGranted) => {
  if (userLocationAccessGranted) {

    const warningHeader = response?.headers?.warning ?? false;

    const dismissToast = () => {
      if (warningToastRef) {
        toast.dismiss(warningToastRef.id);
        warningToastRef = null;
      }
    };

    if (warningHeader
      && (new Date() - STARTUP_TIME > 5000)
      && (warningToastRef?.message !== warningHeader)
    ) {

      if (warningToastRef?.id) {
        dismissToast();
      }

      warningToastRef = {
        message: warningHeader,
        id: showToast({ message: warningHeader.replace('199 - ', ''), toastConfig: {
          autoClose: 18000,
          onClose() {
            dismissToast();
          },
        } }),
      };
    }
  }
};


const RequestConfigManager = ({
  activeProfileId,
  clearAuth,
  masterRequestCancelToken,
  resetMasterCancelToken,
  signedInUserId,
  token,
  userLocationAccessGranted,
}) => {
  const { search } = useLocation();
  const navigate = useNavigate();

  useAuthRecovery();

  const handle401Errors = useCallback(async (error) => {
    const isAuthError = error?.response?.status === 401 && !error.config?.skipAuth;
    const request = error?.config;
    // Step-up is allowed even after a silent renew (retriedAfterRefresh): it redirects rather
    // than looping, and a renewed-but-MFA-stale token surfaces the step-up only on the replay.
    const challenge = error?.response?.headers?.['www-authenticate'];
    const stepUp = isStepUpChallenge(challenge);

    if (isAuthError && request && (stepUp || !request.retriedAfterRefresh)) {
      try {
        const accessToken = await recoverAuth(stepUp ? { stepUp: true, challenge: parseAuthChallenge(challenge) } : undefined);
        return axios({
          ...request,
          retriedAfterRefresh: true,
          headers: { ...request.headers, Authorization: `Bearer ${accessToken}` },
        });
      } catch (renewalError) {
        console.warn('Token renewal failed; signing out', renewalError);
      }
    }

    if (isAuthError) {
      resetMasterCancelToken();
      clearAuth().then(() => {
        navigate({ pathname: APP_ROUTES.LOGIN, search });
      });
    }
    return Promise.reject(error);
  }, [clearAuth, navigate, resetMasterCancelToken, search]);

  const addMasterCancelTokenToRequests = useCallback((config) => {
    config.cancelToken = config.cancelToken || (masterRequestCancelToken && masterRequestCancelToken.token);
  }, [masterRequestCancelToken]);

  const addUserProfileHeaderToRequestsIfNecessary = useCallback((config) => {
    const isActingAsProfile = !!activeProfileId && !!signedInUserId && activeProfileId !== signedInUserId;
    // A read of the profile being switched to names it, not the active one.
    const hasOwnProfileHeader = config.headers.has('USER-PROFILE');

    // /user/me stays the signed-in account, which the profile switcher lists.
    if (config.url && !config.url.includes('/user/me') && isActingAsProfile && !hasOwnProfileHeader) {
      config.headers.set('USER-PROFILE', activeProfileId);
    }
  }, [activeProfileId, signedInUserId]);

  const attachRequestInterceptors = useCallback(() => {
    const requestHandlers = (config) => {
      if (!config) return config;

      addMasterCancelTokenToRequests(config);
      addUserProfileHeaderToRequestsIfNecessary(config);

      return config;
    };

    const interceptorId = axios.interceptors.request.use(requestHandlers);

    return interceptorId;

  }, [addMasterCancelTokenToRequests, addUserProfileHeaderToRequestsIfNecessary]);


  const attachResponseInterceptors = useCallback(() => {
    const interceptorConfig = [
      (response) => {
        handleGeoPermWarningHeader(response, userLocationAccessGranted);
        return response;
      },
      (error) => handle401Errors(error)
    ];

    const interceptorId = axios.interceptors.response.use(...interceptorConfig);

    return interceptorId;
  }, [handle401Errors, userLocationAccessGranted]);


  useEffect(() => {
    const interceptorId = attachRequestInterceptors();

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [attachRequestInterceptors]);

  useEffect(() => {
    const interceptorId = attachResponseInterceptors();

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [attachResponseInterceptors]);

  /* auth header */
  useEffect(() => {
    if (token?.access_token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.access_token}`;
    }

    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [token?.access_token]);
  /* end auth header */

  return null;
};

const mapStateToProps = (state) => ({
  activeProfileId: selectActiveProfileId(state),
  masterRequestCancelToken: state.data.masterRequestCancelToken,
  signedInUserId: selectSignedInUser(state)?.id,
  token: state.data.token,
  userLocationAccessGranted: state.view.userLocationAccessGranted.granted,
});


export default connect(mapStateToProps, { clearAuth, resetMasterCancelToken })(memo(RequestConfigManager));
