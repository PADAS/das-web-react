import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector } from 'react-redux';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { allSubjects } from '../selectors/subjects';
import { fetchAllMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';
import MessageContext from '../InReach/context';

import Badge from '../Badge';
import MessagesModal from '../MessagesModal';
import SleepDetector from '../SleepDetector';
import StateManagedSocketConsumer from '../StateManagedSocketConsumer';
import WithMessageContext from '../InReach';

import styles from './styles.module.scss';

const RADIO_MESSAGE_REALTIME = 'radio_message';
const SLEEP_DETECTION_INTERVAL = 60000;

const MessageMenu = () => {
  const { dispatch, state } = useContext(MessageContext);

  const subjects = useSelector(allSubjects);

  const [selectedSubject, setSelectedSubject] = useState(null);

  const unreads = state.results.filter((message) => !message.read);
  const badgeCount = unreads.length > 9 ? '9+' : unreads.length;

  const canShowMessageMenu = useMemo(
    () => !!state.results.length || !!subjects.filter((subject) => !!subject?.messaging?.length).length,
    [state.results.length, subjects]
  );

  const fetchMenuMessages = useCallback(() => {
    fetchAllMessages({ page_size: 100 })
      .then((results = []) => dispatch(fetchMessagesSuccess({ results })))
      .catch((error) => console.warn('error fetching messages', { error }));
  }, [dispatch]);

  useEffect(() => {
    fetchMenuMessages();
  }, [dispatch, fetchMenuMessages]);

  return canShowMessageMenu ? <Dropdown align="end" onToggle={() => setSelectedSubject(null)} className={styles.messageMenu}>
    <Dropdown.Toggle>
      <ChatIcon className={styles.messageIcon} />

      {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
    </Dropdown.Toggle>

    <Dropdown.Menu>
      <MessagesModal onSelectSubject={(subject) => setSelectedSubject(subject)} selectedSubject={selectedSubject} />
    </Dropdown.Menu>

    <StateManagedSocketConsumer
      callback={(payload) => dispatch(updateMessageFromRealtime(payload.data))}
      onStateMismatch={fetchMenuMessages}
      type={RADIO_MESSAGE_REALTIME}
    />

    <SleepDetector interval={SLEEP_DETECTION_INTERVAL} onSleepDetected={fetchMenuMessages} />
  </Dropdown> : null;
};

const MessageMenuWithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default memo(MessageMenuWithContext);
