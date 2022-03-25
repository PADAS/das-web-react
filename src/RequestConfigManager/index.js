import { memo, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';
import axios from 'axios';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { toast } from 'react-toastify';

import { clearAuth, resetMasterCancelToken } from '../ducks/auth';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { showToast } from '../utils/toast';

const STARTUP_TIME = new Date();

let warningToastRef;

const handleWarningHeader = (response) => {
  const warningHeader = response?.headers?.warning;

  const dismissToast = () => {
    toast.dismiss(warningToastRef.id);
    warningToastRef = null;
  };

  if (warningHeader
      && (new Date() - STARTUP_TIME > 5000)
  ) {

    if (warningToastRef?.id) {
      dismissToast();
    }

    warningToastRef = {
      message: warningHeader,
      id: showToast({ message: warningHeader.replace('199 - ', ''), toastConfig: {
        onClose() {
          dismissToast();
        },
      } }),
    };
  }
};

const debouncedHandleWarningHeader = debounce(handleWarningHeader, 1500);

const RequestConfigManager = (props) => {
  const { clearAuth, history, location,
    masterRequestCancelToken, resetMasterCancelToken, selectedUserProfile, token,
    user } = props;

  const handle401Errors = useCallback((error) => {
    if (error && error.toString().includes('401')) {
      resetMasterCancelToken();
      clearAuth().then(() => {
        history.push({
          pathname: `${REACT_APP_ROUTE_PREFIX}login`,
          search: location.search,
        });
      });
    }
  }, [clearAuth, history, location?.search, resetMasterCancelToken]);

  const handleWarningHeader = useCallback(debouncedHandleWarningHeader, []);

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
        handleWarningHeader(response);
        return response;
      },
      (error) => {
        handle401Errors(error);
        return Promise.reject(error);
      }
    ];

    const interceptorId = axios.interceptors.response.use(...interceptorConfig);

    return interceptorId;
  }, [handle401Errors, handleWarningHeader]);


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

const mapStateToProps = ({ data: { selectedUserProfile, user, masterRequestCancelToken, token } }) => ({
  selectedUserProfile, user, masterRequestCancelToken, token,
});


export default connect(mapStateToProps, { clearAuth, resetMasterCancelToken })(memo(withRouter(RequestConfigManager)));