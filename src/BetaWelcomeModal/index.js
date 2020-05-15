import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { updateUserPreferences } from '../ducks/user-preferences';
import { removeModal } from '../ducks/modals';

import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';


const { Header, Title, Body, Footer } = Modal;

const BetaWelcomeModal = (props) => {
  const { id, removeModal, updateUserPreferences, userPreferences } = props;

  const onClose = () => {
    updateUserPreferences({
      ...userPreferences,
      seenBeta: true,
    });
    trackEvent('Beta Preview', 'Accepted Beta Introduction', null);
    removeModal(id);
  };

  return <Fragment>
    <Header>
      <Title>EarthRanger Beta Preview</Title>
    </Header>
    <Form onSubmit={onClose}>
      <Body style={{maxHeight: '60vh', overflowY: 'scroll'}}>
        <p>You have early access to the upcoming version of EarthRanger!</p>
        <p>Here&apos;s what we ask:</p>
        <ul className={styles.list}>
          <li>Try using the new EarthRanger the same way you use the current version.  We want to make sure everything works for you as expected. </li>
        </ul>
 
        <p>If you have feedback about this preview or anything else, you may use the &quot;Contact Support&quot; link in the top right menu.</p>
        <p>Or, reach us directly at <a href="mailto:feedback@earthranger.com">feedback@earthranger.com</a>.</p>
      </Body>
      <Footer>
        <Button tabIndex={2} type="submit" variant="primary">OK</Button>
      </Footer>
    </Form>
  </Fragment>;
};

const mapStateToProps = ({ view: { userPreferences }  }) => ({ userPreferences });

export default connect(mapStateToProps, { removeModal, updateUserPreferences })(memo(BetaWelcomeModal));