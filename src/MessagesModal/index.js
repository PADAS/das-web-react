import React, { Fragment, memo }  from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import Modal from 'react-bootstrap/Modal';

import { removeModal } from '../ducks/modals';

const { Body, Footer, Header } = Modal;

const MessagesModal =  ({ id:modalId, params = {}, removeModal }) => {
  return <Fragment>
    <Header>
      <h2>Messages</h2>
    </Header>
    <Body>
      <ParamFedMessageList params={params} />
    </Body>
    <Footer>
      <Button variant='primary' onClick={() => removeModal(modalId)}>Close</Button>
    </Footer>
  </Fragment>;
};

export default connect(null, { removeModal })(memo(MessagesModal));