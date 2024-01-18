import React, { memo, useCallback, useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('eula');

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

  const adminReferrer = /admin/.test(rerouteCookieValue);

  const generateTempAuthHeaderIfNecessary = useCallback(() => temporaryAccessToken ? {
    headers: { 'Authorization': `Bearer ${temporaryAccessToken}` },
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

    dispatch(acceptEula({ accept: true, eula: eula.id, user: user.id }, generateTempAuthHeaderIfNecessary()))
      .then(() => dispatch(fetchCurrentUser())
        .catch(() => this.props.history.push({
          pathname: `${REACT_APP_ROUTE_PREFIX}login`,
          search: this.props.location.search,
        })))
      .then(() => setSubmitted(true))
      .catch((error) => {
        console.warn('error fetching EULA', JSON.parse(JSON.stringify(error)));

        setFormError(true);
      });
  }, [dispatch, eula.id, formAccepted, generateTempAuthHeaderIfNecessary, user.id]);

  useEffect(() => {
    dispatch(fetchCurrentUser())
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    deleteCookie('routeAfterEulaAccepted');
    deleteCookie('temporaryAccessToken');
  }, []);

  return !!pageLoaded && <div className={styles.wrapper}>
    <Modal.Dialog>
      <Modal.Header>
        <Modal.Title>{t('modalTitle')}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body className={styles.modalBody}>
          <p>
            {t('modalBody.eulaLink.0')}
            <a download={`${eula.version}.pdf`} href={eula.eula_url} rel="noopener noreferrer" target="_blank">
              {t('modalBody.eulaLink.1')}
            </a>
            {t('modalBody.eulaLink.2')}
          </p>

          <label htmlFor="eula-acceptance-check">
            <input checked={formAccepted} id="eula-acceptance-check" onChange={onAcceptToggle} type="checkbox" />

            <strong className={styles.agreementText}>{t('modalBody.acceptanceCheckboxLabel')}</strong>
          </label>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={onCancel} variant="secondary">{t('modalFooter.cancelButton')}</Button>

          <Button disabled={!formAccepted} type="submit" variant="primary">{t('modalFooter.acceptButton')}</Button>

          {formError && <Alert className={styles.error} variant="danger">{t('modalFooter.errorAlertMessage')}</Alert>}
        </Modal.Footer>
      </Form>
    </Modal.Dialog>

    {submitted && !rerouteCookieValue && <Navigate to={rerouteOnSuccess} />}

    {canceled && !adminReferrer && <Navigate to={`${REACT_APP_ROUTE_PREFIX}login`} />}
  </div>;
};

export default memo(EulaPage);