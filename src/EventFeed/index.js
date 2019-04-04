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
        loader={<li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more events...</li>}
      >
        {
          events.map((item, index) => (
            <li className={`${styles.listItem} ${styles[`priority-${item.priority}`]}`} key={`${item.id}-${index}`}>
              <button className={styles.icon} onClick={() => onIconClick(item)}><EventIcon iconId={item.icon_id} /></button>
              <button type="button" className={styles.title} onClick={() => onTitleClick(item)}>{displayTitleForEventByEventType(item, eventTypes)}</button>
              <DateTime className={styles.date} date={item.updated_at} />
              {eventHasLocation &&
                <div className={styles.jump}>
                  <button title="Jump to the location for this event" type="button" className={styles.jump} onClick={() => onJumpClick(item)}></button>
                </div>
              }
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