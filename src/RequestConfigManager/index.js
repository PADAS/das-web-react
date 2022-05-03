import { memo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import { clearAuth, resetMasterCancelToken } from '../ducks/auth';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { showToast } from '../utils/toast';
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
  clearAuth,
  userLocationAccessGranted,
  masterRequestCancelToken,
  resetMasterCancelToken,
  selectedUserProfile,
  token,
  user,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handle401Errors = useCallback((error) => {
    if (error && error.toString().includes('401')) {
      resetMasterCancelToken();
      clearAuth().then(() => {
        navigate({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search });
      });
    }
  }, [clearAuth, location?.search, navigate, resetMasterCancelToken]);

  const addMasterCancelTokenToRequests = useCallback((config) => {
    config.cancelToken = config.cancelToken || (masterRequestCancelToken && masterRequestCancelToken.token);
  }, [masterRequestCancelToken]);

  const addUserProfileHeaderToRequestsIfNecessary = useCallback((config) => {
    const profile = (selectedUserProfile && selectedUserProfile.id)
    && (user && user.id)
    && (selectedUserProfile.id !== user.id)
    && selectedUserProfile.id;

    if (config.url && !config.url.includes('/user/me') && profile) {
      config.headers['USER-PROFILE'] = profile;
    }
  }, [selectedUserProfile, user]);

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
      (error) => {
        handle401Errors(error);
        return Promise.reject(error);
      }
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
  }, [token]);
  /* end auth header */

  return null;
};

const mapStateToProps = ({ data: { selectedUserProfile, user, masterRequestCancelToken, token }, view: { userLocationAccessGranted } }) => ({
  selectedUserProfile, user, masterRequestCancelToken, token, userLocationAccessGranted: userLocationAccessGranted.granted,
});


export default connect(mapStateToProps, { clearAuth, resetMasterCancelToken })(memo(RequestConfigManager));