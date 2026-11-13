import { memo, useCallback, useContext, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { allSubjects } from '../selectors/subjects';
import {
  fetchAllMessages,
  fetchMessagesSuccess,
  fetchUnreadMessagesCount,
  updateMessageFromRealtime,
  updateUnreadMessagesCount,
} from '../ducks/messaging';
import MessageContext from '../InReach/context';

import Badge from '../Badge';
import MessagesModal from '../MessagesModal';
import SleepDetector from '../SleepDetector';
import StateManagedSocketConsumer from '../StateManagedSocketConsumer';
import WithMessageContext from '../InReach';

import * as styles from './styles.module.scss';

const MENU_MESSAGES_PAGE_SIZE = 100;
const RADIO_MESSAGE_REALTIME = 'radio_message';
const SLEEP_DETECTION_INTERVAL = 60000;

const MessageMenu = () => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'nav.messageMenu' });

  const subjects = useSelector(allSubjects);

  const messageContext = useContext(MessageContext);

  const [selectedSubject, setSelectedSubject] = useState(null);

  const messageDispatch = messageContext.dispatch;
  const unreadMessagesCount = messageContext.state.unreadMessagesCount;

  const canShowMessageMenu = !!messageContext.state.results.length
    || subjects.some((subject) => !!subject?.messaging?.length);

  const checkForUnreadMessages = useCallback(async () => {
    try {
      const response = await fetchUnreadMessagesCount();

      messageDispatch(updateUnreadMessagesCount(response.data.data.count));
    } catch (error) {
      console.warn('error checking for unread messages', { error });
    }
  }, [messageDispatch]);

  const fetchMenuMessages = useCallback(async () => {
    try {
      const results = await fetchAllMessages({ page_size: MENU_MESSAGES_PAGE_SIZE });

      messageDispatch(fetchMessagesSuccess({ results: results ?? [] }));
    } catch (error) {
      console.warn('error fetching messages', { error });
    }
  }, [messageDispatch]);

  useEffect(() => {
    checkForUnreadMessages();
  }, [checkForUnreadMessages, messageContext.state.results]);

  if (!canShowMessageMenu) {
    return null;
  }

  return <Dropdown align="end" className={styles.messageMenu} onToggle={() => setSelectedSubject(null)}>
    <Dropdown.Toggle
      aria-label={unreadMessagesCount ? t('unreadToggleLabel', { count: unreadMessagesCount }) : t('toggleLabel')}
      as="button"
      className={styles.messageMenuToggle}
      title={t('toggleLabel')}
      type="button"
    >
      <ChatIcon aria-hidden="true" className={styles.messageIcon} />

      {!!unreadMessagesCount && <Badge aria-hidden="true" className={styles.badge} count={unreadMessagesCount} />}
    </Dropdown.Toggle>

    <Dropdown.Menu>
      <MessagesModal onSelectSubject={setSelectedSubject} selectedSubject={selectedSubject} />
    </Dropdown.Menu>

    <StateManagedSocketConsumer
      callback={(payload) => messageDispatch(updateMessageFromRealtime(payload.data))}
      onStateMismatch={fetchMenuMessages}
      type={RADIO_MESSAGE_REALTIME}
    />

    <SleepDetector interval={SLEEP_DETECTION_INTERVAL} onSleepDetected={fetchMenuMessages} />
  </Dropdown>;
};

const MessageMenuWithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default memo(MessageMenuWithContext);
