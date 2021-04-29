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

  const clearSelectedSubject = () => {
    console.log('clearSelectedSubject fired');
    setSelectedSubject(null);
  };

  return <Fragment>
    <Header>
      {!selectedSubject && <h2>Messages</h2>}
      {selectedSubject && <Fragment>
        <h5>Messages: {selectedSubject.name}</h5>
        {selectedSubject && <Button variant='secondary' onClick={clearSelectedSubject}>&larr; All messages</Button>}
      </Fragment>}
    </Header>
    <Body style={{display: selectedSubject ? 'none' : 'block'}}>
      <MessageSummaryList onMessageClick={onSummaryMessageClick}  />
    </Body>
    {selectedSubject && <Body>
      <ParamFedMessageList params={params} isReverse={true} senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} />
    </Body>}
    <Footer>
      {!selectedSubject && <Button variant='primary' onClick={() => removeModal(modalId)}>Close</Button>}
      {selectedSubject && <MessageInput subjectId={selectedSubject.id} />}
    </Footer>
  </Fragment>;
};

const mapStateToProps = ({ data: { subjectStore } }) => ({
  subjectStore,
});

export default connect(mapStateToProps, { removeModal })(memo(MessagesModal));