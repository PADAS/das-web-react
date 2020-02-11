import React, { useEffect, useState, memo } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { ReactComponent as EarthRangerLogo } from '../../common/images/earth-ranger-logo-vertical.svg';

import styles from './styles.module.scss';

const { Dialog, Header, Title, Body, Footer } = Modal;

const EulaPage = (props) => {
  const [eulaAccepted, setEulaAcceptance] = useState(false);

  const onSubmit = (event, ...rest) => {
    event.preventDefault();
    if (!eulaAccepted) return;

    console.log('submit', event, rest);
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
          <p>Please take a moment to <a href="#/link/to/whatever">click here and read our EULA before using EarthRanger</a>.</p>
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
  </div>;
};

export default connect(null, null)(memo(EulaPage));