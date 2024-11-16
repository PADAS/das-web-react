import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { messageIsValidForDisplay } from '../../utils/messaging';

import StateManagedSocketConsumer from '../../StateManagedSocketConsumer';

const RADIO_MESSAGE_REALTIME = 'radio_message';

const NewInReachMessageNotificationPlayer = ({ onPlayNotificationSound }) => {
  const subjectStore = useSelector((state) => state.data.subjectStore);

  const receivedMessages = useRef(new Set());

  const onSocketUpdate = (payload) => {
    const shouldNotifyAboutNewInReachMessage = payload?.data?.id
      && !receivedMessages.current.has(payload.data.id)
      && messageIsValidForDisplay(payload.data, subjectStore);
    if (shouldNotifyAboutNewInReachMessage) {
      onPlayNotificationSound();

      receivedMessages.current.add(payload.data.id);
    }
  };

  return <StateManagedSocketConsumer callback={onSocketUpdate} type={RADIO_MESSAGE_REALTIME} />;
};

export default NewInReachMessageNotificationPlayer;
