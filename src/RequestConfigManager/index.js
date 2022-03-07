import { memo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { clearAuth, resetMasterCancelToken } from '../ducks/auth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';

const GEO_PERMISSIONS_AUTH_DENIED_ERROR_MESSAGE = 'GEO_PERMISSIONS_UNAUTHORIZED';

const RequestConfigManager = (props) => {
  const { clearAuth,  history, location, masterRequestCancelToken, resetMasterCancelToken, selectedUserProfile, token, user } = props;

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
  }, [clearAuth, history, location.search, resetMasterCancelToken]);

  const handleWarningHeader = useCallback((response) => {
    const warningHeader = response?.headers?.warning;

    if (warningHeader) {
      console.warn('warning header on response detected!', warningHeader); // TOAST here for geo-permission-protected data
    };
  }, []);

  const handleGeoPermission403Errors = useCallback((error) => {
    const apiResponseErrorIsGeoPermissionsRelated = error =>
      error.statuCode === 403
    && error.message === GEO_PERMISSIONS_AUTH_DENIED_ERROR_MESSAGE;

    if (apiResponseErrorIsGeoPermissionsRelated(error)) {
      // TOAST here for geo-permission errors
    }
  }, []);

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

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [addMasterCancelTokenToRequests, addUserProfileHeaderToRequestsIfNecessary]);


  const attachResponseInterceptors = useCallback(() => {
    const interceptorConfig = [
      (response) => {
        handleWarningHeader(response);
        return response;
      },
      (error) => {
        handle401Errors(error);
        handleGeoPermission403Errors(error);
        return Promise.reject(error);
      }
    ];

    const interceptorId = axios.interceptors.response.use(interceptorConfig);

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [handle401Errors, handleGeoPermission403Errors, handleWarningHeader]);


  useEffect(() => {
    attachRequestInterceptors();
  }, [attachRequestInterceptors]);

  useEffect(() => {
    attachResponseInterceptors();
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