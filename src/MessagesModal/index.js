import React, { Fragment, memo, useState }  from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import MessageSummaryList from '../MessageList/MessageSummaryList';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import Modal from 'react-bootstrap/Modal';

import { removeModal } from '../ducks/modals';
import { extractSubjectFromMessage } from '../utils/messaging';

const { Body, Footer, Header } = Modal;

const MessagesModal =  ({ id:modalId, removeModal, subjectStore }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const params = selectedSubject ? { subject_id: selectedSubject.id } : null;
  
  const onSummaryMessageClick = (message) => {
    const subject = subjectStore?.[extractSubjectFromMessage(message)?.id];

    if (!subject) return null;

    setSelectedSubject(subject);
  };

  return <Fragment>
    <Header>
      <h2>Messages</h2>
    </Header>
    <Body style={{display: params ? 'none' : 'block'}}>
      <MessageSummaryList onMessageClick={onSummaryMessageClick}  />
      {params && <Fragment>
        <Button variant='secondary' onClick={() => setSelectedSubject(null)}>Back</Button>
        <ParamFedMessageList params={params} isReverse={true} />
      </Fragment>}
    </Body>
    {params && <Body>
      <Button variant='secondary' onClick={() => setSelectedSubject(null)}>Back</Button>
      <ParamFedMessageList params={params} isReverse={true} />
    </Body>}
    <Footer>
      <Button variant='primary' onClick={() => removeModal(modalId)}>Close</Button>
    </Footer>
  </Fragment>;
};

const mapStateToProps = ({ data: { subjectStore } }) => ({
  subjectStore,
});

export default connect(mapStateToProps, { removeModal })(memo(MessagesModal));