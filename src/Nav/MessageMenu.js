import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import { SocketContext } from '../withSocketConnection';
import Badge from '../Badge';

import { allSubjects } from '../selectors/subjects';

import MessagesModal from '../MessagesModal';

import { fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const { Toggle, Menu } = Dropdown;

const MessageMenu = (props) => {
  const { subjects } = props;
  const [selectedSubject, setSelectedSubject] = useState(null);

  const onDropdownToggle = () => {
    setSelectedSubject(null);
  };

  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(MessageContext);

  const onSelectSubject = useCallback((subject) => {
    setSelectedSubject(subject);
  }, []);

  useEffect(() => {
    const handleRealtimeMessage = ({ data:msg }) => {
      dispatch(updateMessageFromRealtime(msg));
    };
    
    socket.on('radio_message', handleRealtimeMessage);

    return () => {
      socket.off('radio_message', handleRealtimeMessage);
    };
  }, [dispatch, socket]);

  useEffect(() => {
    fetchMessages({ page_size: 250 })
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      });
  }, [dispatch]);

  const unreads = state.results.filter(msg => !msg.read);

  const badgeCount = unreads.length > 9 ? '9+' : unreads.length;

  const canShowMessageMenu = useMemo(() => !!state.results.length
    || !!subjects.filter(subject => !!subject?.messaging?.length).length, [state.results.length, subjects]);

  if (!canShowMessageMenu) return null;

  return <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
    <Toggle disabled={!state.results.length}>
      <ChatIcon />
      {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
    </Toggle>
    <Menu className={styles.messageMenu}>
      <MessagesModal showClose={false} onSelectSubject={onSelectSubject} selectedSubject={selectedSubject} />
     
    </Menu>
  </Dropdown>;
};

const mapStateToProps = (state) => ({
  subjects: allSubjects(state),
});

const WithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default connect(mapStateToProps, null)(memo(WithContext));
