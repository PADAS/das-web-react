import React, { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import MessageList from '../MessageList';
import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import { SocketContext } from '../withSocketConnection';

import { fetchMessages, fetchMessagesSuccess, readMessage, updateMessageFromRealtime } from '../ducks/messaging';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';


const { Toggle, Menu, Item } = Dropdown;

const MessageMenu = (props) => {
  const { subjects } = props;

  const listRef = useRef();

  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(MessageContext);

  useEffect(() => {
    const handleRealtimeMessage = (msg) => {
      dispatch(updateMessageFromRealtime(msg));
    };
    
    socket.on('radio_message', handleRealtimeMessage);

    return () => {
      socket.off('radio_message', handleRealtimeMessage);
    };
  }, [dispatch, socket]);

  useEffect(() => {
    fetchMessages()
      .then((response) => {
        dispatch(fetchMessagesSuccess(response?.data?.data));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      });
  }, [dispatch]);

  const messageArray = state?.results ?? [];

  const unreads = messageArray.filter(msg => !msg.read);
  const reads = messageArray.filter(msg => !unreads.map(m => m.id).includes(msg.id));

  const displayMessageList = [...unreads, ...reads].slice(0, Math.max(unreads.length, 15));

  const onDropdownToggle = useCallback((isOpen) => {
    if (!isOpen) {
      const updates = unreads.map(msg =>({
        ...msg,
        read: true,
      }));

      updates.forEach((message) => readMessage(message));
    }
  }, [unreads]);

  return <WithMessageContext>
    <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
      <Toggle disabled={!messageArray.length}>
        <ChatIcon /> {!!unreads.length && `(${unreads.length})`}
      </Toggle>
      <Menu>
        {!!displayMessageList.length && <MessageList ref={listRef} className={styles.messageList} messages={displayMessageList} />}
        <Item>
          <Button variant='link'>See all &raquo;</Button>
        </Item>
      </Menu>
    </Dropdown>
  </WithMessageContext>;
};

const mapStateToProps = (state) => ({
  subjects: state.data.subjectStore,
});

export default connect(mapStateToProps, null)(memo(MessageMenu));