import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LocationJumpButton from '../LocationJumpButton';

import { getCoordinatesForEvent } from '../utils/events';
import { displayTitleForEventByEventType } from '../utils/events';

import styles from './styles.module.scss';

const EventFeed = (props) => {
  const { events, eventTypes, hasMore, map, onScroll, onTitleClick, onIconClick } = props;

  return (
    <InfiniteScroll
      element='ul'
      hasMore={hasMore}
      loadMore={onScroll}
      useWindow={false}
      loader={<li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more events...</li>}
    >
      {events.map((item, index) => {
          const coordinates = getCoordinatesForEvent(item);
          return <li className={`${styles.listItem} ${styles[`priority-${item.priority}`]}`} key={`${item.id}-${index}`}>
            <button className={styles.icon} onClick={() => onIconClick(item)}><EventIcon iconId={item.icon_id} /></button>
            <span className={styles.serialNumber}>{item.serial_number}</span>
            <button type="button" className={styles.title} onClick={() => onTitleClick(item)}>{displayTitleForEventByEventType(item, eventTypes)}</button>
            <DateTime className={styles.date} date={item.updated_at} />
            {coordinates &&
              <div className={styles.jump}>
                <LocationJumpButton coordinates={coordinates} map={map} />
              </div>
            }
        </li>})}
    </InfiniteScroll>
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
};

EventFeed.propTypes = {
  events: PropTypes.array.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onScroll: PropTypes.func.isRequired,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  onJumpClick: PropTypes.func,
  map: PropTypes.object.isRequired,
};
