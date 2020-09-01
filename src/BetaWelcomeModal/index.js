import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { updateUserPreferences } from '../ducks/user-preferences';
import { removeModal } from '../ducks/modals';

import { trackEvent } from '../utils/analytics';


const { Header, Title, Body, Footer } = Modal;

const BetaWelcomeModal = (props) => {
  const { id, removeModal, updateUserPreferences, userPreferences } = props;

  const onClose = () => {
    updateUserPreferences({
      ...userPreferences,
      seenSunsetWarning: true,
    });
    trackEvent('Release Intro', 'Dismissed Legacy Sunset Modal', null);
    removeModal(id);
  };

  return <Fragment>
    <Header>
      <Title>EarthRanger Legacy Version Sunset </Title>
    </Header>
    <Form onSubmit={onClose}>
      <Body style={{maxHeight: '60vh', overflowY: 'scroll'}}>
        <p>Valued EarthRanger users, We hope you&apos;ve found the new version of EarthRanger launched nearly three months ago to be a more useful tool in helping you with your critically important work!  After working closely with many of you to make ongoing improvements to the new version since its release, we believe it is time to sunset the legacy version.</p>
        <p>As a result, we will ending access to the legacy version of EarthRanger as of September 30, 2020.  As always, if you have any concerns or feedback, please contact us at feedback@earthranger.com.</p>
        <p>Thanks again for all you do in protecting the world&apos;s animals and their habitats!</p>
        <p>-The EarthRanger Team</p>
      </Body>
      <Footer>
        <Button tabIndex={2} type="submit" variant="primary">OK</Button>
      </Footer>
    </Form>
  </Fragment>;
};

const mapStateToProps = ({ view: { userPreferences }  }) => ({ userPreferences });

export default connect(mapStateToProps, { removeModal, updateUserPreferences })(memo(BetaWelcomeModal));