import React, { useEffect, useState, memo } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { ReactComponent as EarthRangerLogo } from '../../common/images/earth-ranger-logo-vertical.svg';

import styles from './styles.module.scss';

const DEFAULT_POST_EULA_URL = '/beta';

const { Dialog, Header, Title, Body, Footer } = Modal;

const EulaPage = (props) => {
  const [eulaAccepted, setEulaAcceptance] = useState(false);
  const [submitted, setSubmitState] = useState(false);
  const rerouteCookieValue = document.cookie.split(' ').find(item => item.startsWith('returnRoute='));

  const destinationOnAccept = rerouteCookieValue ? rerouteCookieValue.replace('token=', '').replace(';', '') : DEFAULT_POST_EULA_URL;

  const onSubmit = (event, ...rest) => {
    event.preventDefault();
    if (!eulaAccepted) return;

    setSubmitState(true);
  };

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
          <p>Please <a href="#/link/to/whatever">click here and read our EULA</a> before using EarthRanger.</p>
          <label>
            <input checked={eulaAccepted} type='checkbox' onChange={onAcceptToggle} />
            I agree to the terms and conditions of the EarthRanger EULA.
          </label>
        </Body>
        <Footer>
          <Button variant='secondary'>Cancel</Button>
          <Button disabled={!eulaAccepted} variant='primary' type='submit'>Accept</Button>
        </Footer>
      </Form>
    </Dialog>;
    {submitted && <Redirect to={destinationOnAccept} />}
  </div>;
};

/* NEEDS FROM REDUX: `accepted_eula` to know if the user is up-to-date, `current_eula` to get version info and a document link to the most recent EULA */
export default connect(null, null)(memo(EulaPage));