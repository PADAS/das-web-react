import React, { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import MessageList from '../MessageList';
import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import { SocketContext } from '../withSocketConnection';
import Badge from '../Badge';

import MessagesModal from '../MessagesModal';

import { bulkReadMessages, fetchMessages, fetchMessagesNextPage, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';
import { addModal } from '../ducks/modals';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';


const { Toggle, Menu, Item } = Dropdown;

const MessageMenu = ({ addModal }) => {
  const listRef = useRef();

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
    fetchMessages({ page_size: 25 })
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      });
  }, [dispatch]);

  const showAllMessagesModal = useCallback(() => {
    addModal({
      content: MessagesModal,
    });
    // trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Open Report Note');
  }, [addModal]);

  const unreads = state.results.filter(msg => !msg.read);

  const onDropdownToggle = useCallback((isOpen) => {
    if (!!unreads.length) {
      const ids = unreads.map(({ id }) => id);
      bulkReadMessages(ids);
    }
  }, [unreads]);

  
  const loadMoreMessages = useCallback(() => {
    fetchMessagesNextPage(state.next)
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      });
  }, [dispatch, state.next]);

  return <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
    <Toggle disabled={!state.results.length}>
      <ChatIcon />
      {!!unreads.length && <Badge className={styles.badge} count={unreads.length} />}
    </Toggle>
    <Menu className={styles.messageMenus}>
      <div ref={listRef} className={styles.messageList}>
        <MessageList containerRef={listRef} onScroll={loadMoreMessages} hasMore={!!state.next} messages={state.results} />
      </div>
      <Item className={styles.seeAll}>
        <Button variant='link' disabled={!state.results.length} onClick={showAllMessagesModal}>See all &raquo;</Button>
      </Item>
    </Menu>
  </Dropdown>;
};

const mapStateToProps = (state) => ({
  subjects: state.data.subjectStore,
});

const WithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default connect(mapStateToProps, { addModal })(memo(WithContext));