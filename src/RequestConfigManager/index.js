import { memo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import differenceInMinutes from 'date-fns/difference_in_minutes';

import { clearAuth, resetMasterCancelToken } from '../ducks/auth';
import { setSeenWarningHeaderMessage, setSeen403ErrorMessage } from '../ducks/geo-perm-ui';
import { WARNING_HEADER_TOAST_TIME_THRESHOLD, ACCESS_DENIED_NO_LOCATION_TOAST_THRESHOLD } from '../utils/geo-perms';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { showToast } from '../utils/toast';

const STARTUP_TIME = new Date();

const GEO_PERMISSIONS_AUTH_DENIED_ERROR_MESSAGE = 'GEO_PERMISSIONS_UNAUTHORIZED';

const RequestConfigManager = (props) => {
  const { clearAuth, geoPermMessageTimestamps, history, location,
    masterRequestCancelToken, resetMasterCancelToken, selectedUserProfile, token,
    user, setSeenWarningHeaderMessage, setSeen403ErrorMessage } = props;

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

  const handleWarningHeader = useCallback((response) => {
    const warningHeader = response?.headers?.warning;
    let toastRef;

    if (warningHeader) {
      const lastShownWarningHeaderToast = geoPermMessageTimestamps?.lastSeenWarningHeaderMessage;

      const shouldShowWarningHeaderToast = !lastShownWarningHeaderToast
        || (differenceInMinutes(new Date(), new Date(lastShownWarningHeaderToast)) > WARNING_HEADER_TOAST_TIME_THRESHOLD);

      if (shouldShowWarningHeaderToast
          && !toastRef
          &&  (new Date() - STARTUP_TIME > 4000)) {
        setSeenWarningHeaderMessage(new Date().toISOString());

        toastRef = showToast({ message: warningHeader, toastConfig: {
          onClose() {
            toastRef = null;
          },
        } });
      };
    }
  }, [geoPermMessageTimestamps?.lastSeenWarningHeaderMessage, setSeenWarningHeaderMessage]);

  const handleGeoPermission403Errors = useCallback((error) => {
    const apiResponseErrorIsGeoPermissionsRelated = error =>
      error.statuCode === 403
      && error.message === GEO_PERMISSIONS_AUTH_DENIED_ERROR_MESSAGE;

    const shouldShowGeoPermErrorToast = !geoPermMessageTimestamps?.lastSeen403ErrorMessage
      || differenceInMinutes(new Date(), new Date(geoPermMessageTimestamps?.lastSeen403ErrorMessage) > ACCESS_DENIED_NO_LOCATION_TOAST_THRESHOLD);

    if (apiResponseErrorIsGeoPermissionsRelated(error) && shouldShowGeoPermErrorToast) {
      showToast({ message: error.message }, { onClose() {
        setSeen403ErrorMessage(new Date().toISOString());
      } });
    }
  }, [geoPermMessageTimestamps?.lastSeen403ErrorMessage, setSeen403ErrorMessage]);

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
        handleGeoPermission403Errors(error);
        return Promise.reject(error);
      }
    ];

    const interceptorId = axios.interceptors.response.use(...interceptorConfig);

    return interceptorId;
  }, [handle401Errors, handleGeoPermission403Errors, handleWarningHeader]);


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

const mapStateToProps = ({ data: { selectedUserProfile, user, masterRequestCancelToken, token }, view: { geoPermMessageTimestamps } }) => ({
  selectedUserProfile, user, masterRequestCancelToken, token, geoPermMessageTimestamps,
});


export default connect(mapStateToProps, { clearAuth, resetMasterCancelToken, setSeenWarningHeaderMessage, setSeen403ErrorMessage })(memo(withRouter(RequestConfigManager)));