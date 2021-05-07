import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import { sendMessage } from '../ducks/messaging';
import { generateNewMessage } from '../utils/messaging';

import Button from 'react-bootstrap/Button';

import styles from './styles.module.scss';

const TEXT_MAX_LENGTH = 160;

const MessageInput = (props) => {
  const { subject } = props;
  const formRef = useRef(null);
  const textInputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const characterCount = inputValue.length;

  useEffect(() => {
    if (!!textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  const onMessageSubmit = useCallback((event) => {
    event.preventDefault();

    const data = new FormData(formRef.current);
    const value = data.get(`chat-${subject.id}`);
    

    const { url } = subject.messaging[0];
    const msg = generateNewMessage({ geometry: subject?.last_position, properties: subject }, { text: value, read: true });

    sendMessage(url, msg);

    setInputValue('');
    textInputRef.current.focus();

  }, [subject]);

  const handleInputChange = useCallback(({ target: { value } }) => {
    setInputValue(value);
  }, []);

  if (!subject?.messaging?.length) return null;

  return <form ref={formRef} onSubmit={onMessageSubmit} className={styles.chatControls}>
    <input placeholder='Type your message here...' maxLength={TEXT_MAX_LENGTH} type='text' value={inputValue} onChange={handleInputChange} ref={textInputRef} name={`chat-${subject.id}`} id={`chat-${subject.id}`} />
    <Button type='submit' id={`chat-submit-${subject.id}`}>Send</Button>
    <small>{characterCount}/{TEXT_MAX_LENGTH}</small>
  </form>;
};

const mapStateToProps = ({ data: { subjectStore } }, ownProps) => ({
  subject: subjectStore[ownProps?.subjectId],
});

export default connect(mapStateToProps, null)(memo(MessageInput));