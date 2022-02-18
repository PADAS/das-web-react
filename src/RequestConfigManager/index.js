import { memo, useRef, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { clearAuth, resetMasterCancelToken } from '../ducks/auth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';

const RequestConfigManager = (props) => {
  const { clearAuth,  history, location, masterRequestCancelToken, resetMasterCancelToken, selectedUserProfile, token, user } = props;
  const userProfileHeaderInterceptor = useRef(null);
  const masterRequestCancelTokenManager = useRef(null);
  const onAuthFailure = useRef(null);

  /* profile header */
  useEffect(() => {
    const profile = (selectedUserProfile && selectedUserProfile.id)
        && (user && user.id)
        && (selectedUserProfile.id !== user.id)
        && selectedUserProfile.id;

    const addUserProfileHeaderIfNecessary = (config) => {
      if (!config) return config;

      if (config.url && !config.url.includes('/user/me') && profile) {
        config.headers['USER-PROFILE'] = profile;
      }
      return config;
    };
    if (userProfileHeaderInterceptor.current) {
      axios.interceptors.request.eject(userProfileHeaderInterceptor.current);
    }
    userProfileHeaderInterceptor.current = axios.interceptors.request.use(addUserProfileHeaderIfNecessary);
  }, [user, selectedUserProfile]);
  /* end profile header */


  /* master cancel token */
  useEffect(() => {
    const addMasterCancelTokenForRequests = (config) => {
      if (!config) return config;
      return {
        ...config,
        cancelToken: config.cancelToken || (masterRequestCancelToken && masterRequestCancelToken.token),
      };
    };
    if (masterRequestCancelTokenManager.current) {
      axios.interceptors.request.eject(masterRequestCancelTokenManager.current);
    }
    masterRequestCancelTokenManager.current = axios.interceptors.request.use(addMasterCancelTokenForRequests);
  }, [masterRequestCancelToken]);
  /* end master cancel token */

  const apiResponseErrorIsGeoPermissionsRelated = error => !!error;

  useEffect(() => {
    /* specific failure-case routing for unauthorized requests related to geo-permissions */
    const handleGeoPermissionsAuthFailure = (response, error) => {
      if (apiResponseErrorIsGeoPermissionsRelated(error)) {
        // pop up some warning toast, or redirect to geo-permissions info route
      }
      return Promise.reject(error);
    };

    const interceptorId = axios.interceptors.response.use(handleGeoPermissionsAuthFailure);

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [clearAuth, history, location.search, resetMasterCancelToken]);

  /* boot to login on 401 */
  useEffect(() => {
    const responseHandlerWithFailureCase = (response, error) => {
      if (error && error.toString().includes('401')) {
        resetMasterCancelToken();
        clearAuth().then(() => {
          history.push({
            pathname: `${REACT_APP_ROUTE_PREFIX}login`,
            search: location.search,
          });
        });
      }
      return Promise.reject(error);
    };

    const interceptorId = axios.interceptors.response.use(responseHandlerWithFailureCase);

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [clearAuth, history, location.search, resetMasterCancelToken]);
  /* end boot to login on 401 */

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