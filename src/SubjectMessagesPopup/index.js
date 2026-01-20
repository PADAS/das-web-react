import React, { memo } from 'react';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';
import { useMessagesPermissions } from '../hooks/usePermissions';
import { calcDisplayNameForSubject } from '../utils/subjects';

import MessageInput from '../MessageInput';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';

import * as styles from './styles.module.scss';

const SubjectMessagesPopup = ({ data }) => {
  const { hasMessagesCreatePermission } = useMessagesPermissions();

  const { properties } = data;

  return <>
    <div className={styles.header}>
      <h6>
        <ChatIcon /> {calcDisplayNameForSubject(properties)}
      </h6>
    </div>

    <ParamFedMessageList
      className={styles.messageList}
      isReverse
      params={{ subject_id: properties.id }}
      senderDetailStyle={SENDER_DETAIL_STYLES.SHORT}
    />

    {hasMessagesCreatePermission && <MessageInput subjectId={properties.id} />}
  </>;
};

export default memo(SubjectMessagesPopup);
