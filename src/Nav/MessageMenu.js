import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';

import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import { SocketContext } from '../withSocketConnection';
import Badge from '../Badge';

import MessagesModal from '../MessagesModal';

import { fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';
import { addModal, removeModal } from '../ducks/modals';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';

const MessageMenu = ({ addModal, modals, removeModal }) => {
  const [modalId, setModalId] = useState(null);


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

  const toggleMessagesModal = useCallback(() => {
    if (modalId) {
      removeModal(modalId);
    } else {
      const { id } = addModal({
        backdrop: true,
        content: MessagesModal,
        modalProps: {
          className: 'messaging-modal',
        }
      });

      setModalId(id);

      /*  if (!!unreads.length) {
        const ids = unreads.map(({ id }) => id);
        bulkReadMessages(ids);
      } */

    }
    // trackEvent('Messaging', 'Open Message Modal');
  }, [addModal, modalId, removeModal]);

  useEffect(() => {
    /* in case the modal is closed externally */
    if (!modals.some(({ content }) => content === MessagesModal)) {
      setModalId(null);
    }
  }, [modals]);



  const badgeCount = unreads.length > 9 ? '9+' : unreads.length;

  return  <Button variant='link' disabled={!state.results.length} className={`${styles.messageMenu} ${!!modalId ? styles.active : ''}`} onClick={toggleMessagesModal}>
    <ChatIcon />
    {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
  </Button>;

/*   return <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
    <Toggle disabled={!state.results.length}>
      <ChatIcon />
      {!!unreads.length && <Badge className={styles.badge} count={badgeCount} />}
    </Toggle>
    <Menu className={styles.messageMenu}>
      <Header className={styles.header}>
        <h5>
        Recent Messages
        </h5>
        <Button variant='light'><EditIcon /></Button>
      </Header>
      <div ref={listRef} className={styles.messageList}>
        {!state.results.length && <span style={{padding: '1rem', display: 'block', textAlign: 'right'}}>No messages</span>}
        {!!state.results.length && <MessageList emptyMessage={initialEmptyMessage} containerRef={listRef} onMessageSubjectClick={onMessageSubjectClick} onScroll={loadMoreMessages} hasMore={!!state.next} messages={state.results} />}
      </div>
      <Item className={styles.seeAll}>
        <Button variant='link' disabled={!state.results.length} onClick={toggleMessagesModal}>See all &raquo;</Button>
      </Item>
    </Menu>
  </Dropdown>; */
};

const mapStateToProps = (state) => ({
  subjects: state.data.subjectStore,
  modals: state.view.modals.modals,
});

const WithContext = (props) => <WithMessageContext>
  <MessageMenu {...props} />
</WithMessageContext>;

export default connect(mapStateToProps, { addModal, removeModal })(memo(WithContext));