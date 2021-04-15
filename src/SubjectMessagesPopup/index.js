import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import Button from 'react-bootstrap/Button';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import MessageList from '../MessageList';
import { SocketContext } from '../withSocketConnection';
import LoadingOverlay from '../LoadingOverlay';

import { INITIAL_MESSAGE_LIST_STATE, fetchMessages, fetchMessagesSuccess, messageListReducer, updateMessageFromRealtime, sendMessage, readMessage } from '../ducks/messaging';
import { generateNewMessage } from '../utils/messaging';

import styles from './styles.module.scss';

const TEXT_MAX_LENGTH = 160;

const SubjectMessagesPopup = (props) => {
  const  { data: { geometry, properties } } = props;

  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);
  const socket = useContext(SocketContext);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoadState] = useState(true);

  const recentMessages = useMemo(() => {
    return (state?.results ?? []).slice(0, 50)
      .sort((a, b) => new Date(a.message_time) - new Date(b.message_time));
  }, [state]);

  const onMessageSubmit = useCallback((event) => {
    event.preventDefault();

    const data = new FormData(formRef.current);
    const value = data.get(`chat-${properties.id}`);

    const msg = generateNewMessage([{ geometry, properties }], { message_type: 'outbox', text: value, read: true, message_time: new Date().toISOString() });

    sendMessage(msg);

    setInputValue('');
    textInputRef.current.focus();

  }, [geometry, properties]);

  const handleInputChange = useCallback(({ target: { value } }) => {
    setInputValue(value);
  }, []);


  const listRef = useRef(null);
  const formRef = useRef(null);
  const textInputRef = useRef(null);

  const characterCount = inputValue.length;

  useEffect(() => {
    if (!!recentMessages.length && !!listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [recentMessages]);

  useEffect(() => {
    if (!!textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    return () => {
      const updates = recentMessages
        .filter(msg => !msg.read)
        .map(msg => ({
          ...msg,
          read: true,
        }));
      if (!!updates.length) {
        updates.forEach((message) => readMessage(message));
      }
    };
  }, [dispatch, recentMessages]);

  useEffect(() => {
    if (!!properties.id) {
      setLoadState(true);
      fetchMessages({subject_id: properties.id})
        .then((response) => {
          dispatch(fetchMessagesSuccess(response?.data?.data ?? [], true));
        })
        .finally(() => {
          setLoadState(false);
        });
    }
  }, [dispatch, properties.id]);

  useEffect(() => {
    const handleRealtimeMessage = (msg) => {
      if (msg.receiver.id === properties.id) {
        dispatch(updateMessageFromRealtime(msg));
      }
    };
    
    socket.on('radio_message', handleRealtimeMessage);

    return () => {
      socket.off('radio_message', handleRealtimeMessage);
    };
  }, [dispatch, properties.id, socket]);

  return <Popup className={styles.popup} anchor='left' offset={[20, 20]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
    <div className={styles.header}>
      <h6><ChatIcon /> {properties.name}</h6>
    </div>
    {loading && <LoadingOverlay />}
    {!loading && <MessageList ref={listRef} messages={recentMessages} />}
    <form ref={formRef} onSubmit={onMessageSubmit} className={styles.chatControls}>
      <input maxLength={TEXT_MAX_LENGTH} type='text' value={inputValue} onChange={handleInputChange} ref={textInputRef} name={`chat-${properties.id}`} id={`chat-${properties.id}`} />
      <Button type='submit' id={`chat-submit-${properties.id}`}>Send</Button>
    </form>
    <small>{characterCount}/{TEXT_MAX_LENGTH}</small>


  </Popup>;
};

export default memo(SubjectMessagesPopup);

SubjectMessagesPopup.propTypes = {
  data: PropTypes.object.isRequired,
};