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
      seenReleaseIntro: true,
    });
    trackEvent('Release Intro', 'Accepted Summer 2020 Release', null);
    removeModal(id);
  };

  return <Fragment>
    <Header>
      <Title>EarthRanger Summer 2020 Release</Title>
    </Header>
    <Form onSubmit={onClose}>
      <Body style={{maxHeight: '60vh', overflowY: 'scroll'}}>
        <p>Welcome to the latest version of EarthRanger!</p>
        <p>The team has been hard at work in putting together a collection of significant upgrades 
          to aid you in your mission.  We hope that you’ll find EarthRanger to be an even more 
          powerful and useful tool.</p>
        <ul className = {styles.list}>
          <li>A full description of the release can be found here: <a href="https://earthranger.com/News/2020/Major-EarthRanger-Release-Summer-2020.aspx">Release Article</a></li>
          <li>Should you need it, the previous version can be found here: <a href="/legacy/">Legacy Version</a>, or in the top-right menu.</li>
          <li>And, as always, please send us feedback at <a href="mailto:feedback@earthranger.com">feedback@earthranger.com</a>.</li>
        </ul>
        <p>Thank you for your continued efforts to protect the world’s animals and their habitats!</p>
      </Body>
      <Footer>
        <Button tabIndex={2} type="submit" variant="primary">OK</Button>
      </Footer>
    </Form>
  </Fragment>;
};

const mapStateToProps = ({ view: { userPreferences }  }) => ({ userPreferences });

export default connect(mapStateToProps, { removeModal, updateUserPreferences })(memo(BetaWelcomeModal));