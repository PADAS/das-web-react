import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import Button from 'react-bootstrap/Button';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';
import ExpandIcon from '../common/images/icons/expand-arrow.png';

import MessagesModal from '../MessagesModal';

import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import MessageInput from '../MessageInput';

import { sendMessage } from '../ducks/messaging';
import { hidePopup } from '../ducks/popup';
import { addModal } from '../ducks/modals';
import { generateNewMessage } from '../utils/messaging';

import styles from './styles.module.scss';

const TEXT_MAX_LENGTH = 160;
const isReverse = true;

const SubjectMessagesPopup = (props) => {
  const  { addModal, data: { geometry, properties }, hidePopup, popupId } = props; 

  const [inputValue, setInputValue] = useState('');

  const params = useMemo(() => {
    return { subject_id: properties.id };
  }, [properties.id]);

  const onMessageSubmit = useCallback((event) => {
    event.preventDefault();

    const data = new FormData(formRef.current);
    const value = data.get(`chat-${properties.id}`);
    

    const { url } = JSON.parse(properties.messaging)[0];
    const msg = generateNewMessage({ geometry, properties }, { text: value, read: true });

    sendMessage(url, msg);

    setInputValue('');
    textInputRef.current.focus();

  }, [geometry, properties]);

  const handleInputChange = useCallback(({ target: { value } }) => {
    setInputValue(value);
  }, []);

  const expandChat = useCallback(() => {
    addModal({
      content: MessagesModal,
      params,
      modalProps: {
        className: 'messaging-modal',
      }
    });
    hidePopup(popupId);
  }, [addModal, hidePopup, params, popupId]);


  const formRef = useRef(null);
  const textInputRef = useRef(null);

  const characterCount = inputValue.length;

  useEffect(() => {
    if (!!textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  return <Popup className={styles.popup}/*  offset={[20, 20]} */ coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
    <div className={styles.header}>
      <h6><ChatIcon /> {properties.name}</h6>
      <img src={ExpandIcon} alt='Expand subject chat history' onClick={expandChat} />
    </div>
    <ParamFedMessageList className={styles.messageList} params={params} isReverse={isReverse} />
    <MessageInput subjectId={properties.id} />

  </Popup>;
};

export default connect(null, { addModal, hidePopup })(memo(SubjectMessagesPopup));

SubjectMessagesPopup.propTypes = {
  data: PropTypes.object.isRequired,
};