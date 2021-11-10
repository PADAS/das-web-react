import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ReactComponent as ChatIcon } from '../../../../common/images/icons/chat-icon.svg';

import ParamFedMessageList from '../../../../messaging/MessageList/ParamFedMessageList';
import MessageInput from '../../../../messaging/MessageInput';
import { SENDER_DETAIL_STYLES } from '../../../../messaging/MessageList/SenderDetails';

import { hidePopup } from '../../../../ducks/popup';
import { addModal } from '../../../../ducks/modals';

import { usePermissions } from '../../../../permissions/hooks';
import { PERMISSION_KEYS, PERMISSIONS } from '../../../../constants';

import styles from './styles.module.scss';

const isReverse = true;

const SubjectMessagesPopup = (props) => {
  const  { data: { properties } } = props;

  const hasMessagingWritePermissions = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.CREATE);

  const params = useMemo(() => {
    return { subject_id: properties.id };
  }, [properties.id]);

  return <>
    <div className={styles.header}>
      <h6><ChatIcon /> {properties.name}</h6>
      {/* <img src={ExpandIcon} alt='Expand subject chat history' onClick={expandChat} /> */}
    </div>
    <ParamFedMessageList senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} className={styles.messageList} params={params} isReverse={isReverse} />
    {!!hasMessagingWritePermissions && <MessageInput subjectId={properties.id} />}

  </>;
};

export default connect(null, { addModal, hidePopup })(memo(SubjectMessagesPopup));

SubjectMessagesPopup.propTypes = {
  data: PropTypes.object.isRequired,
};