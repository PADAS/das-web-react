import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import MessageInput from '../MessageInput';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';

import { hidePopup } from '../ducks/popup';
import { addModal } from '../ducks/modals';

import styles from './styles.module.scss';

const isReverse = true;

const SubjectMessagesPopup = (props) => {
  const  { data: { geometry, properties } } = props; 

  const params = useMemo(() => {
    return { subject_id: properties.id };
  }, [properties.id]);

  // const expandChat = useCallback(() => {
  //   addModal({
  //     content: MessagesModal,
  //     params,
  //     modalProps: {
  //       className: 'messaging-modal',
  //     }
  //   });
  //   hidePopup(popupId);
  // }, [addModal, hidePopup, params, popupId]);

  return <Popup className={styles.popup}/*  offset={[20, 20]} */ coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
    <div className={styles.header}>
      <h6><ChatIcon /> {properties.name}</h6>
      {/* <img src={ExpandIcon} alt='Expand subject chat history' onClick={expandChat} /> */}
    </div>
    <ParamFedMessageList senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} className={styles.messageList} params={params} isReverse={isReverse} />
    <MessageInput subjectId={properties.id} />

  </Popup>;
};

export default connect(null, { addModal, hidePopup })(memo(SubjectMessagesPopup));

SubjectMessagesPopup.propTypes = {
  data: PropTypes.object.isRequired,
};