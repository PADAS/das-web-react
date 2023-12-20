import React, { memo, useCallback, useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo-vertical.svg';

import { clearAuth, postAuth } from '../ducks/auth';
import { fetchEula } from '../ducks/eula';
import { fetchSystemStatus } from '../ducks/system-status';
import { REACT_APP_ROUTE_PREFIX, SYSTEM_CONFIG_FLAGS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import styles from './styles.module.scss';

const LoginPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('login');

  const eulaURL = useSelector((state) => state.data.eula.eula_url);
  const systemConfig = useSelector((state) => state.view.systemConfig);

  const [errorMessage, setErrorMessage] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const eulaEnabled = systemConfig?.[SYSTEM_CONFIG_FLAGS.EULA];

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
          ? 'Invalid credentials given. Please try again.'
          : 'An error has occurred. Please try again.');
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, formData, location.search, location.state?.from, navigate]);

  const onInputChange = useCallback((event) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }, [errorMessage, formData]);

  useEffect(() => {
    dispatch(clearAuth());
    dispatch(fetchEula());
    dispatch(fetchSystemStatus());
  }, [dispatch]);

  return <div className={styles.container}>
    <EarthRangerLogo className={styles.logo} />

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

    {eulaEnabled === true && <p className={styles.eulalink}>
      <a href={eulaURL} target="_blank" rel="noopener noreferrer">{t('eulaLink')}</a>
    </p>}
  </div>;
};

export default memo(LoginPage);
