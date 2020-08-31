import React, { useCallback, useEffect, useState, memo } from 'react';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { clearAuth } from '../../ducks/auth';
import { fetchCurrentUser } from '../../ducks/user';
import { fetchEula, acceptEula } from '../../ducks/eula';

import { deleteCookie } from '../../utils/auth';

import { REACT_APP_ROUTE_PREFIX } from '../../constants';

import Alert from 'react-bootstrap/Alert';

import styles from './styles.module.scss';

const { Dialog, Header, Title, Body, Footer } = Modal;

const EulaPage = (props) => {
  const { acceptEula, clearAuth, eula, fetchCurrentUser, fetchEula, history, location, user, temporaryAccessToken } = props;

  const { eula_url, version:eula_version, id:eula_id } = eula;

  const [pageLoaded, setPageLoadState] = useState(false);
  const [formAccepted, setFormAccepted] = useState(false);
  const [submitted, setSubmitState] = useState(false);
  const [canceled, setCancelState] = useState(false);
  const [rerouteOnSuccess, setRerouteOnSuccess] = useState(REACT_APP_ROUTE_PREFIX);
  const [formError, setFormError] = useState(false);

  const rerouteCookieValue = document.cookie.split(' ').find(item => item.startsWith('routeAfterEulaAccepted=')) ? 
    document.cookie.split(' ').find(item => item.startsWith('routeAfterEulaAccepted='))
      .replace('routeAfterEulaAccepted=', '').replace('"', '').replace(';', '').replace('/"', '/') : null;

  // inspect the redirect cookie set and see if it is an admin endpoint
  const adminReferrer = /admin/.test(rerouteCookieValue);

  const generateTempAuthHeaderIfNecessary = useCallback(() => {
    return temporaryAccessToken ? {
      headers: {
        'Authorization': `Bearer ${temporaryAccessToken}`,
      },
    } : null;
  }, [temporaryAccessToken]);

  useEffect(() => {
    fetchCurrentUser(generateTempAuthHeaderIfNecessary())
    .catch((error) => {
      history.push({
        pathname: `${REACT_APP_ROUTE_PREFIX}login`,
        search: location.search,
      });
    });
    ;
    fetchEula(generateTempAuthHeaderIfNecessary());
  }, [fetchCurrentUser, fetchEula, generateTempAuthHeaderIfNecessary, history, location.search]);

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
      if (!user.accepted_eula) setPageLoadState(true);
      else history.goBack();
    }
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => () => {
      deleteCookie('routeAfterEulaAccepted');
      deleteCookie('temporaryAccessToken');
    }, []);

  const onSubmit = useCallback((event, ...rest) => {
    event.preventDefault();
    setFormError(false);
    if (!formAccepted) return;

    const payload = {
      user: user.id,
      eula: eula_id,
      accept: true,
    };

    acceptEula(payload, generateTempAuthHeaderIfNecessary())
      .then(() => {
        return fetchCurrentUser(generateTempAuthHeaderIfNecessary())
          .catch((error) => {
            this.props.history.push({
              pathname: `${REACT_APP_ROUTE_PREFIX}login`,
              search: this.props.location.search,
            });
          });;
      })
      .then(() => {
        setSubmitState(true);
      })
      .catch((error) => {
        const errorObject = JSON.parse(JSON.stringify(error));
        console.warn('error fetching EULA', errorObject);
        setFormError(true);
      });  

  }, [acceptEula, eula_id, fetchCurrentUser, formAccepted, generateTempAuthHeaderIfNecessary, user.id]);

  const onCancel = useCallback(() => {
    clearAuth();
    setCancelState(true);
  }, [clearAuth]);

  const onAcceptToggle = () => {
    setFormError(false);
    setFormAccepted(!formAccepted);
  };

  return !!pageLoaded && <div className={styles.wrapper}>
    <Dialog>
      <Header>
        <Title>You must accept the End User License Agreement (EULA) to continue</Title>
      </Header>
      <Form onSubmit={onSubmit}>
        <Body className={styles.modalBody}>
          <p>Please <a href={eula_url} download={`${eula_version}.pdf`} target='_blank' rel='noopener noreferrer'>click here and read our EULA</a> before using EarthRanger.</p>
          <label htmlFor='eula-acceptance-check'>
            <input id='eula-acceptance-check' checked={formAccepted} type='checkbox' onChange={onAcceptToggle} /> I agree to the terms and conditions of the EarthRanger EULA.
          </label>
        </Body>
        <Footer>
          <Button variant='secondary' onClick={onCancel}>Cancel</Button>
          <Button disabled={!formAccepted} variant='primary' type='submit'>Accept</Button>
          {formError && <Alert className={styles.error} variant='danger'>There was an issue accepting the EULA. Please try again.</Alert>}
        </Footer>
      </Form>
    </Dialog>;
    {submitted && !rerouteCookieValue && <Redirect to={rerouteOnSuccess} />}
    {canceled && !adminReferrer && <Redirect to={`${REACT_APP_ROUTE_PREFIX}login`} />}
  </div>;
};

const mapStateToProps = ({ data: { eula, user } }) => ({
  eula, user,
});

/* NEEDS FROM REDUX: `accepted_eula` to know if the   is up-to-date, `current_eula` to get version info and a document link to the most recent EULA */
export default connect(mapStateToProps, { acceptEula, clearAuth, fetchCurrentUser, fetchEula })(withRouter(memo(EulaPage)));