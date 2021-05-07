import React, { Fragment, memo, useEffect, useRef, useState }  from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


import MessageSummaryList from '../MessageList/MessageSummaryList';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import MessageInput from '../MessageInput';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';

import { removeModal } from '../ducks/modals';
import { extractSubjectFromMessage } from '../utils/messaging';

import { ReactComponent as EditIcon } from '../common/images/icons/edit.svg';


const { Body, Footer, Header } = Modal;

const MessagesModal =  ({ id:modalId, params:initParamsFromProps, removeModal, subjectStore }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectStore?.[initParamsFromProps?.subject_id] ?? null);
  const [params, setParams] = useState(initParamsFromProps);

  const isInit = useRef(false);

  useEffect(() => {
    if (selectedSubject) {
      setParams({ subject_id: selectedSubject.id });
    } else if (isInit.current) {
      setParams(null);
    }
    isInit.current = true;
  }, [selectedSubject]);
  
  const onSummaryMessageClick = (message) => {
    const subject = subjectStore?.[extractSubjectFromMessage(message)?.id];

    if (!subject) return null;

    setSelectedSubject(subject);
  };

  const showNewMessageDialog = () => {
    
  };

  const clearSelectedSubject = () => {
    console.log('clearSelectedSubject fired');
    setSelectedSubject(null);
  };

  return <Fragment>
    <Header>
      {selectedSubject && <h5>
        {selectedSubject.name} 
        <Button style={{fontSize: '0.85rem', marginLeft: '1em'}} variant='secondary' size='sm' onClick={clearSelectedSubject}>&larr; All messages</Button>
      </h5>}
      {!selectedSubject && <h5>Messages</h5>}
      <Button variant='info' onClick={() => removeModal(modalId)}>Close</Button>
    </Header>
    <Body style={{display: selectedSubject ? 'none' : 'block'}}>
      <MessageSummaryList onMessageClick={onSummaryMessageClick}  />
    </Body>
    {selectedSubject && <Body>
      <ParamFedMessageList params={params} isReverse={true} senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} />
    </Body>}
    {!selectedSubject && <Footer>
      <Button variant='light' onClick={showNewMessageDialog}>
        <EditIcon /> New Message
      </Button>
    </Footer>}
    {selectedSubject &&  <Footer>
      {!selectedSubject.messaging && <strong>You may only receive messages from this subject.</strong>} 
      <MessageInput subjectId={selectedSubject.id} />
    </Footer>}
  </Fragment>;
};

const mapStateToProps = ({ data: { subjectStore } }) => ({
  subjectStore,
});

export default connect(mapStateToProps, { removeModal })(memo(MessagesModal));