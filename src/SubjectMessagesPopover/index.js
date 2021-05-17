import React, { Fragment, forwardRef, memo, createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import MessageInput from '../MessageInput';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const SubjectMessagesPopover = (props) => {
  const { className = '', subject } = props;
  const params = useMemo(() => {
    return { subject_id: subject?.id };
  }, [subject]);

  if (!subject) return null;

  const PopoverContent = <Popover className={styles.popover}>
    <Popover.Title>
      <h6><ChatIcon /> {subject.name}</h6>
    </Popover.Title>
    <Popover.Content>
      <ParamFedMessageList senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} className={styles.messageList} params={params} isReverse={true} />
      <MessageInput subjectId={subject.id} />
    </Popover.Content>
  </Popover>;

  return  <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={PopoverContent} flip={true}>
    <button className={`${styles.popoverTrigger} ${className}`}>
      <ChatIcon />
    </button>
  </OverlayTrigger>;
};

export default memo(SubjectMessagesPopover);