import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import StateManagedSocketConsumer from '../StateManagedSocketConsumer';
import SleepDetector from '../SleepDetector';
import Badge from '../Badge';

import { allSubjects } from '../selectors/subjects';

import MessagesModal from '../MessagesModal';

import { fetchAllMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const RADIO_MESSAGE_REALTIME = 'radio_message';
const SLEEP_DETECTION_INTERVAL = 60000;

const { Toggle, Menu } = Dropdown;

const MessageMenu = (props) => {
  const { subjects } = props;
  const [selectedSubject, setSelectedSubject] = useState(null);

  const onDropdownToggle = () => {
    setSelectedSubject(null);
  };

  const { state, dispatch } = useContext(MessageContext);

  const onSelectSubject = useCallback((subject) => {
    setSelectedSubject(subject);
  }, []);

  const handleRealtimeMessage = useCallback(({ data: msg }) => {
    dispatch(updateMessageFromRealtime(msg));
  }, [dispatch]);

  const fetchMenuMessages = useCallback(() => {
    fetchAllMessages({ page_size: 100 })
      .then((results) => {
        dispatch(fetchMessagesSuccess({ results }));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      });
  }, [dispatch]);

  useEffect(() => {
    fetchMenuMessages();
  }, [dispatch, fetchMenuMessages]);

  const unreads = state.results
    .filter(msg => !msg.read);

  const badgeCount = unreads.length > 9 ? '9+' : unreads.length;

  const canShowMessageMenu = useMemo(() => !!state.results.length
    || !!subjects.filter(subject => !!subject?.messaging?.length).length, [state.results.length, subjects]);

  if (!canShowMessageMenu) return null;

  return <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
    <Toggle>
      <ChatIcon className={styles.messageIcon} />
      {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
    </Toggle>
    <Menu className={styles.messageMenu}>
      <MessagesModal showClose={false} onSelectSubject={onSelectSubject} selectedSubject={selectedSubject} />

    </Menu>
    <StateManagedSocketConsumer type={RADIO_MESSAGE_REALTIME} callback={handleRealtimeMessage} onStateMismatch={fetchMenuMessages} />
    <SleepDetector onSleepDetected={fetchMenuMessages} interval={SLEEP_DETECTION_INTERVAL} />
  </Dropdown>;
};

const mapStateToProps = (state) => ({
  subjects: allSubjects(state),
});

const WithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default connect(mapStateToProps, null)(memo(WithContext));
