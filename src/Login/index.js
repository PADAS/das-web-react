import React, { memo, useCallback, useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo-vertical.svg';

import { clearAuth, postAuth } from '../ducks/auth';
import { fetchEula } from '../ducks/eula';
import { fetchSystemStatus } from '../ducks/system-status';
import { REACT_APP_ROUTE_PREFIX, SYSTEM_CONFIG_FLAGS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import * as styles from './styles.module.scss';

const LoginPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('login');

  const eulaURL = useSelector((state) => state.data.eula.eula_url);
  const systemConfig = useSelector((state) => state.view.systemConfig);
  const requireIdp = !!systemConfig?.require_idp;
  const idpOrgId = systemConfig?.idp_org_id;
  const { loginWithRedirect, isLoading: authLoading } = useAuth0();

  const [errorMessage, setErrorMessage] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authReady, setAuthReady] = useState(true);

  const isEULAEnabled = !!systemConfig?.[SYSTEM_CONFIG_FLAGS.EULA];

  const onFormSubmit = useCallback((event) => {
    event.preventDefault();

    setIsLoading(true);

    dispatch(postAuth(formData))
      .then(() => {
        const options = location.state?.from ? { state: { comesFromLogin: true } } : {};
        navigate(location.state?.from || { pathname: REACT_APP_ROUTE_PREFIX, search: location.search }, options);
      })
      .catch((error) => {
        dispatch(clearAuth());
        setErrorMessage(error.toJSON()?.message?.includes('400')
          ? t('errorAlert.invalidCredentialsMessage')
          : t('errorAlert.unknownErrorMessage'));
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, formData, location.search, location.state?.from, navigate, t]);

  const onInputChange = useCallback((event) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData((formData) => ({ ...formData, [event.target.name]: event.target.value }));
  }, [errorMessage]);

  useEffect(() => {
    dispatch(clearAuth());
    dispatch(fetchEula());
    dispatch(fetchSystemStatus());
  }, [dispatch]);

  useEffect(() => {
    if (requireIdp && !idpOrgId) {
      setErrorMessage('Identity provider organization is not configured.');
      setAuthReady(false);
    }
  }, [requireIdp, idpOrgId]);

  const onAuth0Login = useCallback(async () => {
    try {
      // Prefer router-provided from, then long-persisted intended route, else app root
      const storedIntended = (() => { try { return localStorage.getItem('er:intended_route'); } catch (_) { return null; } })();
      const rawReturnTo = (location.state?.from && (location.state.from.pathname + (location.state.from.search || ''))) || storedIntended || REACT_APP_ROUTE_PREFIX;
      const returnTo = /\/login\b/.test(rawReturnTo) ? REACT_APP_ROUTE_PREFIX : rawReturnTo;

      await loginWithRedirect({
        appState: { returnTo },
        authorizationParams: {
          organization: idpOrgId,
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        },
      });
    } catch (e) {
      setErrorMessage('Sign-in failed. Please try again.');
    }
  }, [loginWithRedirect, idpOrgId, location.state?.from]);

  // Wait for system config to load before rendering to prevent form flash
  // systemConfig always exists but sitename is '' until loaded
  const configLoaded = systemConfig?.sitename !== '';
  if (!configLoaded) {
    return <div className={styles.container}>
      <EarthRangerLogo className={styles.logo} />
    </div>;
  }

  return <div className={styles.container}>
    <EarthRangerLogo className={styles.logo} />
    {requireIdp ? (
      <div className={styles.form}>
        {!idpOrgId && <Alert className={styles.error} variant="danger">{t('errorAlert.missingOrg', 'Identity provider organization is not configured.')}</Alert>}
        {idpOrgId && (
          <Button disabled={!authReady || authLoading} name="idp-login" type="button" variant="primary" onClick={onAuth0Login}>
            {t('loginButtonIdp', 'Sign in with Auth0')}
          </Button>
        )}
        {!!errorMessage && <Alert className={styles.error} variant="danger">{errorMessage}</Alert>}
      </div>
    ) : (
      <Form name="login" className={styles.form} onSubmit={onFormSubmit}>
        <Form.Label htmlFor="username">{t('usernameLabel')}</Form.Label>
        <Form.Control
          id="username"
          name="username"
          onChange={onInputChange}
          required={true}
          type="text"
          value={formData.username}
        />

        <Form.Label htmlFor="password">{t('passwordLabel')}</Form.Label>
        <Form.Control
          id="password"
          name="password"
          onChange={onInputChange}
          required={true}
          type="password"
          value={formData.password}
        />

        <Button disabled={isLoading} name="submit" type="submit" variant="primary">{t('loginButton')}</Button>

        {!!errorMessage && <Alert className={styles.error} variant="danger">{errorMessage}</Alert>}
      </Form>
    )}

    {isEULAEnabled && <p className={styles.eulalink}>
      <a href={eulaURL} target="_blank" rel="noopener noreferrer">{t('eulaLink')}</a>
    </p>}
  </div>;
};

export default memo(LoginPage);
