import React, { memo, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

import { postAuth, clearAuth } from '../ducks/auth';
import { REACT_APP_ROUTE_PREFIX, SYSTEM_CONFIG_FLAGS } from '../constants';

import { fetchSystemStatus } from '../ducks/system-status';
import { fetchEula } from '../ducks/eula';
import useNavigate from '../hooks/useNavigate';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo-vertical.svg';

import styles from './styles.module.scss';

const { Control, Label } = Form;

const LoginPage = ({
  clearAuth,
  eula: { eula_url },
  fetchEula,
  fetchSystemStatus,
  postAuth,
  systemConfig,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const eulaEnabled = systemConfig?.[SYSTEM_CONFIG_FLAGS.EULA];

  const onFormSubmit = useCallback((event) => {
    event.preventDefault();
    setIsLoading(true);

    postAuth(formData)
      .then(() => {
        const options = location.state?.from ? { state: { comesFromLogin: true } } : {};
        navigate(location.state?.from || { pathname: REACT_APP_ROUTE_PREFIX, search: location.search }, options);
      })
      .catch((error) => {
        clearAuth();
        setErrorMessage(error.toJSON()?.message?.includes('400')
          ? 'Invalid credentials given. Please try again.'
          : 'An error has occurred. Please try again.');
      })
      .finally(() => setIsLoading(false));
  }, [clearAuth, formData, location.search, location.state?.from, navigate, postAuth]);

  const onInputChange = useCallback(({ target: { name, value } }) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData({ ...formData, [name]: value });
  }, [errorMessage, formData]);

  useEffect(() => {
    clearAuth();
    fetchEula();
    fetchSystemStatus();
  }, [clearAuth, fetchEula, fetchSystemStatus]);

  return <div className={styles.container}>
    <EarthRangerLogo className={styles.logo} />
    <Form name='login' className={styles.form} onSubmit={onFormSubmit}>
      <Label htmlFor='username'>Username</Label>
      <Control value={formData.username} required={true} onChange={onInputChange} type='text' name='username' id='username' />
      <Label htmlFor='password'>Password</Label>
      <Control value={formData.password} required={true} onChange={onInputChange} type='password' name='password' id='password' />
      <Button variant='primary' type='submit' name='submit' disabled={isLoading}>Log in</Button>
      {!!errorMessage && <Alert className={styles.error} variant='danger'>{errorMessage}</Alert>}
    </Form>

    {eulaEnabled === true && <p className={styles.eulalink}>
      <a href={eula_url} target='_blank' rel='noopener noreferrer'>EarthRanger EULA</a>
    </p>}
  </div>;
};

const mapStateToProps = ({ data: { eula }, view: { systemConfig } }) => ({ eula, systemConfig });

export default connect(mapStateToProps, { postAuth, clearAuth, fetchEula, fetchSystemStatus })(memo(LoginPage));
