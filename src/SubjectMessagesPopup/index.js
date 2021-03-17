import React, { memo, useCallback, useEffect, useMemo, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import Button from 'react-bootstrap/Button';
import MessageContext from '../InReach/context';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import DateTime from '../DateTime';

import { newMessage } from '../ducks/messaging';
import { generateNewMessage } from '../utils/messaging';

import styles from './styles.module.scss';

const SubjectMessagesPopup = (props) => {
  const  { data: { geometry, properties } } = props;

  const { state, dispatch } = useContext(MessageContext);

  const recentMessages = useMemo(() => {
    return ((state[properties.id] && state[properties.id].slice(0, 5)) || [])
      .sort((a, b) => new Date(a.message_time) - new Date(b.message_time));
  }, [properties.id, state]);

  const sendMessage = useCallback((event) => {
    event.preventDefault();

    const data = new FormData(formRef.current);
    const value = data.get(`chat-${properties.id}`);

    const msg = generateNewMessage([{ geometry, properties }], { message_type: 'outbox', text: value, read: true });

    dispatch(newMessage(msg));

    textareaRef.current.value = '';
    textareaRef.current.focus();

  }, [dispatch, geometry, properties]);


  const listRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!!recentMessages.length && !!listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [recentMessages]);

  useEffect(() => {
    if (!!textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <Popup className={styles.popup} anchor='left' offset={[-8, 20]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
      <div className={styles.header}>
        <h4><ChatIcon /> {properties.name}</h4>
      </div>
      <ul ref={listRef} className={styles.messageHistory}>
        {!!recentMessages.length && recentMessages.map(message => 
          <li key={message.id}>
            <span className={styles.senderDetails}>{message.message_type === 'inbox' ? 'incoming' : 'outgoing'}</span>
            <div className={styles.messageDetails}>
              <span className={styles.messageContent}>{message.text}</span>
              <DateTime date={message.message_time} />
            </div>
          </li>
        )}
      </ul>
      <form ref={formRef} onSubmit={sendMessage} className={styles.chatControls}>
        <textarea ref={textareaRef} name={`chat-${properties.id}`} id={`chat-${properties.id}`} />
        <Button type='submit' id={`chat-submit-${properties.id}`}>Send</Button>
      </form>


    </Popup>
  );
};

export default memo(SubjectMessagesPopup);

SubjectMessagesPopup.propTypes = {
  data: PropTypes.object.isRequired,
};