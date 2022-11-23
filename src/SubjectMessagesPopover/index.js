import React, { memo, useMemo } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';
import { usePermissions } from '../hooks';

import MessageInput from '../MessageInput';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import SubjectControlButton from '../SubjectControls/button';

import styles from './styles.module.scss';

const SubjectMessagesPopover = ({ className = '', subject, ...rest }) => {
  const hasMessagingWritePermissions = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.CREATE);

  const buttonClassName = `${className} ${styles.button}`;

  const params = useMemo(() => ({ subject_id: subject?.id }), [subject]);

  if (!subject) return null;

  const PopoverContent = <Popover className={styles.popover}>
    <Popover.Header>
      <h6><ChatIcon /> {subject.name}</h6>
    </Popover.Header>

    <Popover.Body>
      <ParamFedMessageList senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} params={params} isReverse={true} />
      {!!hasMessagingWritePermissions && <MessageInput subjectId={subject.id} />}
    </Popover.Body>
  </Popover>;

  return <OverlayTrigger
      shouldUpdatePosition={true}
      rootClose
      trigger='click'
      placement='auto'
      overlay={PopoverContent}
      flip={true}
    >
    <SubjectControlButton
      buttonClassName={buttonClassName}
      containerClassName={styles.container}
      labelText='Messaging'
      {...rest}
    />
  </OverlayTrigger>;
};

export default memo(SubjectMessagesPopover);