import React, { memo, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

import { postAuth, clearAuth } from '../ducks/auth';
import { REACT_APP_ROUTE_PREFIX, FEATURE_FLAGS } from '../constants';

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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const eulaEnabled = systemConfig?.[FEATURE_FLAGS.EULA];

  const onFormSubmit = useCallback((event) => {
    event.preventDefault();
    postAuth({ username, password, hasError, error, errorMessage })
      .then(() => navigate(location.state?.from || { pathname: REACT_APP_ROUTE_PREFIX, search: location.search }))
      .catch((error) => {
        const errorObject = error.toJSON();

        clearAuth();

        const errorMessage = errorObject?.message?.includes('400')
          ? 'Invalid credentials given. Please try again.'
          : 'An error has occured. Please try again.';

        setHasError(true);
        setError(errorObject);
        setErrorMessage(errorMessage);
      });
  }, [clearAuth, error, errorMessage, hasError, location.search, location.state?.from, navigate, password, postAuth, username]);

  const onInputChange = useCallback((event) => {
    event.preventDefault();

    if (hasError) {
      setError({});
      setHasError(false);
    }

    if (event.target.id === 'username') {
      setUsername(event.target.value);
    } else {
      setPassword(event.target.value);
    }
  }, [hasError]);

  useEffect(() => {
    clearAuth();
    fetchEula();
    fetchSystemStatus();
  }, [clearAuth, fetchEula, fetchSystemStatus]);

  return <div className={styles.container}>
    <EarthRangerLogo className={styles.logo} />

    <Form name='login' className={styles.form} onSubmit={onFormSubmit}>
      <Label htmlFor='username'>Username</Label>
      <Control value={username} required={true} onChange={onInputChange} type='text' name='username' id='username' />
      <Label htmlFor='password'>Password</Label>
      <Control value={password} required={true} onChange={onInputChange} type='password' name='password' id='password' />
      <Button variant='primary' type='submit' name='submit'>Log in</Button>
      {hasError && <Alert className={styles.error} variant='danger'>{errorMessage}</Alert>}
    </Form>

    {eulaEnabled === true && <p className={styles.eulalink}>
      <a href={eula_url} target='_blank' rel='noopener noreferrer'>EarthRanger EULA</a>
    </p>}
  </div>;
};

const mapStateToProps = ({ data: { eula }, view: { systemConfig } }) => ({ eula, systemConfig });

export default connect(mapStateToProps, { postAuth, clearAuth, fetchEula, fetchSystemStatus })(memo(LoginPage));
