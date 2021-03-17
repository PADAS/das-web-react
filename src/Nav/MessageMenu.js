import React, { Fragment, memo, useCallback, useMemo, useContext } from 'react';
import flatten from 'lodash/flatten';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import DateTime from '../DateTime';
import MessageContext from '../InReach/context';

import { fetchMessagesSuccess } from '../ducks/messaging';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import styles from './styles.module.scss';


const { Toggle, Menu, Item } = Dropdown;

const MessageMenu = (props) => {
  const { state, dispatch } = useContext(MessageContext);

  const messageArray = useMemo(() => flatten(Object
    .values(state))
    .sort((a, b) => new Date(b.message_time) - new Date(a.message_time)), [state]);

  const unreads = messageArray.filter(msg => !msg.read);
  const reads = messageArray.filter(msg => !unreads.map(m => m.id).includes(msg.id));

  const displayMessageList = [...unreads, ...reads].slice(0, Math.max(unreads.length, 15));

  const onDropdownToggle = useCallback((isOpen) => {
    if (!isOpen) {
      const updates = unreads.map(msg =>({
        ...msg,
        read: true,
      }));

      dispatch(fetchMessagesSuccess(updates));
    }
  }, [dispatch, unreads]);

  return <Dropdown alignRight onToggle={onDropdownToggle} className={styles.messageMenu}>
    <Toggle disabled={!messageArray.length}>
      <ChatIcon /> {!!unreads.length && `(${unreads.length})`}
    </Toggle>
    <Menu>
      {!!displayMessageList.length && 
      <Fragment>
        <h5 className={styles.messageTitle}>Recent Messages</h5>
        <ul className={styles.messageList}>
          {displayMessageList.map(msg =>
            <li key={msg.id} className={msg.read ? styles.read : styles.unread}>
              <Item>
                <span className={styles.messageText}>{msg.text}</span>
                <DateTime className={styles.datetime} date={new Date(msg.message_time)} />
              </Item>
            </li>
          )}
        </ul>
      </Fragment>
      }
      <Item>
        <Button variant='link'>See all &raquo;</Button>
      </Item>
    </Menu>
  </Dropdown>;
};

export default memo(MessageMenu);