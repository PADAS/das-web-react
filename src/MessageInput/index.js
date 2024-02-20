import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { generateNewMessage } from '../utils/messaging';
import { sendMessage } from '../ducks/messaging';

import styles from './styles.module.scss';

const TEXT_MAX_LENGTH = 160;

const MessageInput = ({ subjectId }) => {
  const { t } = useTranslation('components', { keyPrefix: 'messageInput' });

  const formRef = useRef(null);
  const textInputRef = useRef(null);

  const subject = useSelector((state) => state.data.subjectStore[subjectId]);

  const [inputValue, setInputValue] = useState('');

  const onMessageSubmit = useCallback((event) => {
    event.preventDefault();

    const data = new FormData(formRef.current);
    const value = data.get(`chat-${subject.id}`);
    const { url } = subject.messaging[0];
    const msg = generateNewMessage(
      { geometry: subject?.last_position, properties: subject },
      { text: value, read: true }
    );

    sendMessage(url, msg);
    setInputValue('');
    textInputRef.current.focus();
  }, [subject]);

  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  return subject?.messaging?.length ? <form className={styles.chatControls} onSubmit={onMessageSubmit} ref={formRef}>
    <input
      id={`chat-${subject.id}`}
      maxLength={TEXT_MAX_LENGTH}
      name={`chat-${subject.id}`}
      onChange={(event) => setInputValue(event.target.value)}
      placeholder={t('placeholder')}
      ref={textInputRef}
      type="text"
      value={inputValue}
    />

    <Button disabled={!inputValue.length} id={`chat-submit-${subject.id}`} type="submit">{t('sendButton')}</Button>

    <small>{inputValue.length}/{TEXT_MAX_LENGTH}</small>
  </form> : null;
};

MessageInput.propTypes = {
  subjectId: PropTypes.string.isRequired,
};

export default memo(MessageInput);
