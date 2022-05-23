import React, { memo, useMemo } from 'react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import SubjectControlButton from '../SubjectControls/button';

import { usePermissions } from '../hooks';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';

import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import MessageInput from '../MessageInput';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const SubjectMessagesPopover = (props) => {
  const { className = '', subject, ...rest } = props;

  const hasMessagingWritePermissions = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.CREATE);

  const buttonClassName = `${className} ${styles.button}`;

  const params = useMemo(() => {
    return { subject_id: subject?.id };
  }, [subject]);

  if (!subject) return null;

  const PopoverContent = <Popover className={styles.popover}>
    <Popover.Title>
      <h6><ChatIcon /> {subject.name}</h6>
    </Popover.Title>
    <Popover.Content>
      <ParamFedMessageList senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} params={params} isReverse={true} />
      {!!hasMessagingWritePermissions && <MessageInput subjectId={subject.id} />}
    </Popover.Content>
  </Popover>;

  return  <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={PopoverContent} flip={true}>
    <SubjectControlButton buttonClassName={buttonClassName} containerClassName={styles.container} labelText='Messaging' {...rest} />
  </OverlayTrigger>;
};

export default memo(SubjectMessagesPopover);