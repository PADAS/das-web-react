import React, { useCallback, useEffect, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  ReactComponent as EarthRangerLogo,
} from '../common/images/earth-ranger-logo.svg';

import appConfig from '../config';
import { clearAuth, postAuth } from '../ducks/auth';
import { fetchEula } from '../ducks/eula';
import { REACT_APP_ROUTE_PREFIX, SYSTEM_CONFIG_FLAGS } from '../constants';
import { buildAuth0AuthorizationParams } from '../utils/auth0';
import useNavigate from '../hooks/useNavigate';

import * as styles from './styles.module.scss';

const SUBMIT_LOADER_SIZE = 18;

const LoginPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    loginWithRedirect: auth0LoginWithRedirect,
    isLoading: isAuth0Loading,
  } = useAuth0();
  const navigate = useNavigate();
  const { t } = useTranslation('login');

  const eulaURL = useSelector((state) => state.data.eula.eula_url);
  const systemConfig = useSelector((state) => state.view.systemConfig);

  const passwordInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  const [alertMessage, setAlertMessage] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [formErrors, setFormErrors] = useState({ username: null, password: null });
  const [isLoading, setIsLoading] = useState(false);

  const idpOrgId = systemConfig?.idp_org_id;
  const isEULAEnabled = !!systemConfig?.[SYSTEM_CONFIG_FLAGS.EULA];
  const requireIdp = !!systemConfig?.require_idp;

  const onAuth0Login = useCallback(async () => {
    try {
      await auth0LoginWithRedirect({
        authorizationParams: buildAuth0AuthorizationParams(appConfig.auth0.audience, idpOrgId),
      });
    } catch (_error) {
      setAlertMessage(t('errorAlert.signInFailed'));
    }
  }, [auth0LoginWithRedirect, idpOrgId, t]);

  const onFormSubmit = useCallback(async (event) => {
    event.preventDefault();

    const username = formData.username.trim();
    const password = formData.password.trim();
    const errors = {
      username: username ? null : t('errors.usernameRequired'),
      password: password ? null : t('errors.passwordRequired'),
    };

    if (errors.username) {
      usernameInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }

    if (errors.username || errors.password) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({ username: null, password: null });
    setIsLoading(true);

    try {
      await dispatch(postAuth({ username, password }));
      const options = location.state?.from
        ? { state: { comesFromLogin: true } }
        : {};
      navigate(
        location.state?.from
          || { pathname: REACT_APP_ROUTE_PREFIX, search: location.search },
        options
      );
    } catch (error) {
      dispatch(clearAuth());
      const invalidCredentials = error.toJSON()?.message?.includes('400');

      if (invalidCredentials) {
        usernameInputRef.current?.select();
      }

      setAlertMessage(invalidCredentials
        ? t('errorAlert.invalidCredentialsMessage')
        : t('errorAlert.unknownErrorMessage'));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, formData, location, navigate, t]);

  const onInputChange = useCallback((event) => {
    setFormData((prevFormData) => ({ ...prevFormData, [event.target.name]: event.target.value }));
    setFormErrors((prevFormErrors) => (prevFormErrors[event.target.name]
      ? { ...prevFormErrors, [event.target.name]: null }
      : prevFormErrors));
    setAlertMessage(null);
  }, []);

  useEffect(() => {
    dispatch(clearAuth());
    dispatch(fetchEula());

    const urlParams = new URLSearchParams(location.search);
    const auth0Error = urlParams.get('error');
    const auth0ErrorDescription = urlParams.get('error_description');
    if (auth0Error && auth0ErrorDescription) {
      // There are Auth0 errors in URL parameters. Display an error message
      // based on the error type.
      if (auth0Error === 'access_denied') {
        if (auth0ErrorDescription.includes('not part of the')) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAlertMessage(t('errorAlert.accessDeniedNotAuthorized'));
        } else {
          setAlertMessage(t('errorAlert.accessDeniedNoPermission'));
        }
      } else if (auth0Error === 'unauthorized') {
        setAlertMessage(t('errorAlert.authenticationFailed'));
      } else {
        setAlertMessage(
          t(
            'errorAlert.authenticationError',
            { errorDescription: auth0ErrorDescription },
          )
        );
      }
    }
  }, [dispatch, location.search, t]);

  // Surface a retryable error when the post-Auth0 account-linking gate could
  // not complete — a transient gate failure, or a missing link URL on the
  // unlinked branch. Auth0TokenManager routes those cases here via router state.
  useEffect(() => {
    if (location.state?.authLinkingError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlertMessage(t('errorAlert.signInIncomplete'));
    }
  }, [location.state, t]);

  return <div className={styles.container}>
    <EarthRangerLogo aria-label="EarthRanger" className={styles.logo} role="img" />

    <h1 className={styles.srOnly}>{t('title')}</h1>

    {requireIdp ? (
      <div className={styles.form}>
        <button
          aria-busy={isAuth0Loading}
          aria-label={isAuth0Loading ? t('loginButtonLoadingLabel') : undefined}
          className={styles.loginButton}
          disabled={isAuth0Loading}
          onClick={onAuth0Login}
          type="button"
        >
          {isAuth0Loading
            ? <MoonLoader aria-hidden color="white" size={SUBMIT_LOADER_SIZE} />
            : t(idpOrgId?.trim() ? 'loginButtonIdp' : 'loginButtonEmail')}
        </button>
      </div>
    ) : (
      <form className={styles.form} noValidate onSubmit={onFormSubmit}>
        <label className={`${styles.label} ${formErrors.username ? styles.error : ''}`} htmlFor="username">
          {t('usernameLabel')}
        </label>

        <input
          aria-errormessage={formErrors.username ? 'username-error' : undefined}
          aria-invalid={formErrors.username ? 'true' : undefined}
          autoComplete="username"
          className={styles.input}
          id="username"
          name="username"
          onChange={onInputChange}
          ref={usernameInputRef}
          required
          type="text"
          value={formData.username}
        />
        {formErrors.username && (
          <p className={styles.errorMessage} id="username-error" role="alert">
            {formErrors.username}
          </p>
        )}

        <label className={`${styles.label} ${formErrors.password ? styles.error : ''}`} htmlFor="password">
          {t('passwordLabel')}
        </label>

        <input
          aria-errormessage={formErrors.password ? 'password-error' : undefined}
          aria-invalid={formErrors.password ? 'true' : undefined}
          autoComplete="current-password"
          className={styles.input}
          id="password"
          name="password"
          onChange={onInputChange}
          ref={passwordInputRef}
          required
          type="password"
          value={formData.password}
        />
        {formErrors.password && (
          <p className={styles.errorMessage} id="password-error" role="alert">
            {formErrors.password}
          </p>
        )}

        <button
          aria-busy={isLoading}
          aria-label={isLoading ? t('loginButtonLoadingLabel') : undefined}
          className={styles.loginButton}
          disabled={isLoading}
          type="submit"
        >
          {isLoading
            ? <MoonLoader aria-hidden color="white" size={SUBMIT_LOADER_SIZE} />
            : t('loginButton')}
        </button>
      </form>
    )}

    {!!alertMessage && <div role="alert" className={styles.alertMessage}>{alertMessage}</div>}

    {isEULAEnabled && <a
      aria-label={t('eulaLinkLabel')}
      className={styles.eulaLink}
      href={eulaURL}
      rel="noopener noreferrer"
      target="_blank"
    >
      {t('eulaLink')}
    </a>}
  </div>;
};

export default LoginPage;
