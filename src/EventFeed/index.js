import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import { displayTitleForEventByEventType, eventHasLocation } from '../utils/events';

import styles from './styles.module.scss';

const EventFeed = (props) => {
  const { events, eventTypes, hasMore, onScroll, onTitleClick, onIconClick, onJumpClick } = props;

  return (
    <ul>
      <InfiniteScroll
        hasMore={hasMore}
        loadMore={onScroll}
        useWindow={false}
        loader={<div className="loader" key={0}>Loading more events...</div>}
      >
        {
          events.map((item, index) => (
            <li className={`${styles.listItem} ${styles[`priority-${item.priority}`]}`} key={`${item.id}-${index}`}>
              <div className={styles.icon} onClick={() => onIconClick(item)}><EventIcon iconId={item.icon_id} /></div>
              <a className={styles.title} onClick={() => onTitleClick(item)}>{displayTitleForEventByEventType(item, eventTypes)}</a>
              <DateTime className={styles.date} date={item.updated_at} />
              {eventHasLocation && <a className={styles.jump} onClick={() => onJumpClick(item)}>jumplink</a>}
            </li>
          ))
        }
      </InfiniteScroll>
    </ul>
  )
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(EventFeed);

EventFeed.defaultProps = {
  onTitleClick(event) {
    console.log('title click', event);
  },
  onIconClick(event) {
    console.log('icon click', event);
  },
  onJumpClick(event) {
    console.log('jump click', event);
  },
};

EventFeed.propTypes = {
  events: PropTypes.array.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onScroll: PropTypes.func.isRequired,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  onJumpClick: PropTypes.func,
};