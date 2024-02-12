import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';
import { usePermissions } from '../hooks';

import MessageInput from '../MessageInput';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';

import styles from './styles.module.scss';

const SubjectMessagesPopup = ({ data }) => {
  const hasMessagingWritePermissions = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.CREATE);

  const { properties } = data;

  return <>
    <div className={styles.header}>
      <h6>
        <ChatIcon /> {properties.name}
      </h6>
    </div>

    <ParamFedMessageList
      className={styles.messageList}
      isReverse
      params={{ subject_id: properties.id }}
      senderDetailStyle={SENDER_DETAIL_STYLES.SHORT}
    />

    {!!hasMessagingWritePermissions && <MessageInput subjectId={properties.id} />}
  </>;
};

SubjectMessagesPopup.propTypes = {
  data: PropTypes.shape({
    properties: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
};

export default memo(SubjectMessagesPopup);
