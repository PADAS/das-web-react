import React, { useCallback, useEffect, useState, memo } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { clearAuth } from '../../ducks/auth';
import { fetchCurrentUser } from '../../ducks/user';
// import { fetchEula, acceptEulaForUser } from '../../ducks/eula';

import { REACT_APP_ROUTE_PREFIX } from '../../constants';

import styles from './styles.module.scss';

const DEFAULT_POST_EULA_URL = '/beta';

const { Dialog, Header, Title, Body, Footer } = Modal;

const EulaPage = (props) => {
  const { clearAuth, eula, fetchCurrentUser, user, temporaryAccessToken } = props;

  const [eulaAccepted, setEulaAcceptance] = useState(false);
  const [submitted, setSubmitState] = useState(false);
  const [canceled, setCancelState] = useState(false);

  const generateTempAuthHeaderIfNecessary = useCallback(() => {
    return temporaryAccessToken ? {
      headers: {
        'Authorization': `Bearer ${temporaryAccessToken}`,
      },
    } : null;
  }, [temporaryAccessToken]);

  useEffect(() => {
    const tempAuthHeader = generateTempAuthHeaderIfNecessary();
    fetchCurrentUser(tempAuthHeader);
    // fetchCurrentEula(tempAuthHeader);
  }, [fetchCurrentUser, generateTempAuthHeaderIfNecessary, temporaryAccessToken]);

  const rerouteCookieValue = document.cookie.split(' ').find(item => item.startsWith('routeAfterEulaAccepted='));

  const destinationOnAccept = rerouteCookieValue ? rerouteCookieValue.replace('token=', '').replace(';', '') : DEFAULT_POST_EULA_URL;

  const onSubmit = useCallback((event, ...rest) => {
    event.preventDefault();
    if (!eulaAccepted) return;

    setSubmitState(true);

    /*   const tempAuthHeader = generateTempAuthHeaderIfNecessary();

    const payload = {
      user: user.id,
      eula: eula.id,
      accept: true,
    };

    acceptEulaForUser(payload, tempAuthHeader)
      .then(() => {
        setSubmitState(true);
      })
      .catch((error) => {
        console.log('error accepting eula', error);
      });  */

  }, [eulaAccepted]);

  const onCancel = useCallback(() => {
    clearAuth();
    setCancelState(true);
  }, [clearAuth]);

  const onAcceptToggle = () => {
    setEulaAcceptance(!eulaAccepted);
  };

  return <div className={styles.wrapper}>
    <Dialog>
      <Header>
        <Title>You must accept the End User License Agreement (EULA) to continue</Title>
      </Header>
      <Form onSubmit={onSubmit}>
        <Body className={styles.modalBody}>
          <p>Please <a href='#/link/to/whatever' download='EarthRanger_EULA.pdf' target='_blank' rel='noopener'>click here and read our EULA</a> before using EarthRanger.</p>
          <label htmlFor='eula-acceptance-check'>
            <input id='eula-acceptance-check' checked={eulaAccepted} type='checkbox' onChange={onAcceptToggle} /> I agree to the terms and conditions of the EarthRanger EULA.
          </label>
        </Body>
        <Footer>
          <Button variant='secondary' onClick={onCancel}>Cancel</Button>
          <Button disabled={!eulaAccepted} variant='primary' type='submit'>Accept</Button>
        </Footer>
      </Form>
    </Dialog>;
    {submitted && <Redirect to={destinationOnAccept} />}
    {canceled && <Redirect to={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'login' : '/login'}`} />}
  </div>;
};

const mapStateToProps = ({ data: { eula, user } }) => ({
  eula, user,
});

/* NEEDS FROM REDUX: `accepted_eula` to know if the user is up-to-date, `current_eula` to get version info and a document link to the most recent EULA */
export default connect(mapStateToProps, { clearAuth, fetchCurrentUser })(memo(EulaPage));