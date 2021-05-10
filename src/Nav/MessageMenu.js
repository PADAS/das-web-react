import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';


import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import { SocketContext } from '../withSocketConnection';
import Badge from '../Badge';

import MessagesModal from '../MessagesModal';

import { fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const { Toggle, Menu } = Dropdown;

const MessageMenu = (props) => {

  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(MessageContext);

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

  return <Dropdown alignRight /* onToggle={onDropdownToggle}  */className={styles.messageMenu}>
    <Toggle disabled={!state.results.length}>
      <ChatIcon />
      {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
    </Toggle>
    <Menu className={styles.messageMenu}>
      <MessagesModal showClose={false} />
     
    </Menu>
  </Dropdown>;
};

const mapStateToProps = (state) => ({
  subjects: state.data.subjectStore,
});

const WithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default connect(mapStateToProps, null)(memo(WithContext));