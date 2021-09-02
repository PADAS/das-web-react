import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import StateManagedSocketConsumer from '../StateManagedSocketConsumer';
import Badge from '../Badge';

import { allSubjects } from '../selectors/subjects';
import { messageIsValidForDisplay } from '../utils/messaging';

import MessagesModal from '../MessagesModal';

import { fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const RADIO_MESSAGE_REALTIME = 'radio_message';

const { Toggle, Menu } = Dropdown;

const MessageMenu = (props) => {
  const { subjects, subjectStore } = props;
  const [selectedSubject, setSelectedSubject] = useState(null);

  const onDropdownToggle = () => {
    setSelectedSubject(null);
  };

  const { state, dispatch } = useContext(MessageContext);

  const onSelectSubject = useCallback((subject) => {
    setSelectedSubject(subject);
  }, []);

  const handleRealtimeMessage = useCallback(({ data:msg }) => {
    dispatch(updateMessageFromRealtime(msg));
  }, [dispatch]);

  const fetchMenuMessages = useCallback(() => {
    fetchMessages({ page_size: 250 })
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      });
  }, [dispatch]);

  useEffect(() => {
    console.log('fetchMenuMessages in effect hook, will i be infinite? amen');
    fetchMenuMessages();
  }, [dispatch, fetchMenuMessages]);

  const unreads = state.results
    .filter(msg => !msg.read)
    .filter(msg => messageIsValidForDisplay(msg, subjectStore));

  const badgeCount = unreads.length > 9 ? '9+' : unreads.length;

  const canShowMessageMenu = useMemo(() => !!state.results.length
    || !!subjects.filter(subject => !!subject?.messaging?.length).length, [state.results.length, subjects]);

  if (!canShowMessageMenu) return null;

  return <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
    <Toggle>
      <ChatIcon />
      {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
    </Toggle>
    <Menu className={styles.messageMenu}>
      <MessagesModal showClose={false} onSelectSubject={onSelectSubject} selectedSubject={selectedSubject} />
     
    </Menu>
    <StateManagedSocketConsumer type={RADIO_MESSAGE_REALTIME} callback={handleRealtimeMessage} onStateMismatch={fetchMenuMessages} />
  </Dropdown>;
};

const mapStateToProps = (state) => ({
  subjects: allSubjects(state),
  subjectStore: state.data.subjectStore,
});

const WithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default connect(mapStateToProps, null)(memo(WithContext));
