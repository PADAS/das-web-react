import React, { memo, useCallback, useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { acceptEula, fetchEula } from '../../ducks/eula';
import { clearAuth } from '../../ducks/auth';
import { deleteCookie } from '../../utils/auth';
import { fetchCurrentUser } from '../../ducks/user';
import { REACT_APP_ROUTE_PREFIX } from '../../constants';
import useNavigate from '../../hooks/useNavigate';

import styles from './styles.module.scss';

const EulaPage = ({ temporaryAccessToken }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const eula = useSelector((state) => state.data.eula);
  const user = useSelector((state) => state.data.user);

  const [canceled, setCanceled] = useState(false);
  const [formAccepted, setFormAccepted] = useState(false);
  const [formError, setFormError] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [rerouteOnSuccess, setRerouteOnSuccess] = useState(location.state?.from || REACT_APP_ROUTE_PREFIX);
  const [submitted, setSubmitted] = useState(false);

  const hasRouteAfterEulaAcceptedCookie = document.cookie
    .split(' ')
    .find((item) => item.startsWith('routeAfterEulaAccepted='));
  const rerouteCookieValue = hasRouteAfterEulaAcceptedCookie
    ? document.cookie
      .split(' ')
      .find((item) => item.startsWith('routeAfterEulaAccepted='))
      .replace('routeAfterEulaAccepted=', '')
      .replace('"', '')
      .replace(';', '')
      .replace('/"', '/')
    : null;

  // inspect the redirect cookie set and see if it is an admin endpoint
  const adminReferrer = /admin/.test(rerouteCookieValue);

  const generateTempAuthHeaderIfNecessary = useCallback(() => temporaryAccessToken ? {
    headers: {
      'Authorization': `Bearer ${temporaryAccessToken}`,
    },
  } : null, [temporaryAccessToken]);

  const onAcceptToggle = useCallback(() => {
    setFormError(false);
    setFormAccepted(!formAccepted);
  }, [formAccepted]);

  const onCancel = useCallback(() => {
    dispatch(clearAuth());
    setCanceled(true);
  }, [dispatch]);

  const onSubmit = useCallback((event) => {
    event.preventDefault();
    setFormError(false);

    if (!formAccepted) return;

    const payload = { accept: true, eula: eula.id, user: user.id };

    dispatch(acceptEula(payload, generateTempAuthHeaderIfNecessary()))
      .then(() => dispatch(fetchCurrentUser(generateTempAuthHeaderIfNecessary()))
        .catch(() => {
          this.props.history.push({
            pathname: `${REACT_APP_ROUTE_PREFIX}login`,
            search: this.props.location.search,
          });
        }))
      .then(() => setSubmitted(true))
      .catch((error) => {
        const errorObject = JSON.parse(JSON.stringify(error));
        console.warn('error fetching EULA', errorObject);

        setFormError(true);
      });
  }, [dispatch, eula.id, formAccepted, generateTempAuthHeaderIfNecessary, user.id]);

  useEffect(() => {
    dispatch(fetchCurrentUser(generateTempAuthHeaderIfNecessary()))
      .catch(() => navigate({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search }));
    dispatch(fetchEula(generateTempAuthHeaderIfNecessary()));
  }, [dispatch, generateTempAuthHeaderIfNecessary, location.search, navigate]);

  useEffect(() => {
    if (rerouteCookieValue) {
      setRerouteOnSuccess(rerouteCookieValue);
    }
  }, [rerouteCookieValue]);

  useEffect(() => {
    if (submitted && rerouteCookieValue) {
      window.location = rerouteCookieValue;
    }
  }, [rerouteCookieValue, submitted]);

  useEffect(() => {
    if (canceled && adminReferrer && rerouteCookieValue) {
      window.location = rerouteCookieValue.concat('logout/');
    }
  }, [adminReferrer, canceled, rerouteCookieValue]);

  useEffect(() => {
    if (user.hasOwnProperty('accepted_eula')) {
      if (!user.accepted_eula) {
        setPageLoaded(true);
      } else {
        navigate(-1);
      }
    }
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => () => {
    deleteCookie('routeAfterEulaAccepted');
    deleteCookie('temporaryAccessToken');
  }, []);

  return !!pageLoaded && <div className={styles.wrapper}>
    <Modal.Dialog>
      <Modal.Header>
        <Modal.Title>You must accept the End User License Agreement (EULA) to continue</Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body className={styles.modalBody}>
          <p>Please <a href={eula.eula_url} download={`${eula.version}.pdf`} target='_blank' rel='noopener noreferrer'>click here and read our EULA</a> before using EarthRanger.</p>

          <label htmlFor='eula-acceptance-check'>
            <input id='eula-acceptance-check' checked={formAccepted} type='checkbox' onChange={onAcceptToggle} />

            <strong className={styles.agreementText}>I agree to the terms and conditions of the EarthRanger EULA.</strong>
          </label>
        </Modal.Body>

        <Modal.Footer>
          <Button variant='secondary' onClick={onCancel}>Cancel</Button>

          <Button disabled={!formAccepted} variant='primary' type='submit'>Accept</Button>
          {formError && <Alert className={styles.error} variant='danger'>There was an issue accepting the EULA. Please try again.</Alert>}
        </Modal.Footer>
      </Form>
    </Modal.Dialog>

    {submitted && !rerouteCookieValue && <Navigate to={rerouteOnSuccess} />}

    {canceled && !adminReferrer && <Navigate to={`${REACT_APP_ROUTE_PREFIX}login`} />}
  </div>;
};

export default memo(EulaPage);