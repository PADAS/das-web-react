import React, { useRef, memo } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LoadingOverlay from '../LoadingOverlay';
import LocationJumpButton from '../LocationJumpButton';

import { getCoordinatesForEvent } from '../utils/events';
import { displayTitleForEventByEventType } from '../utils/events';

import styles from './styles.module.scss';

const EventFeed = memo((props) => {
  const { events, eventTypes, hasMore, loading, map, onScroll, onTitleClick, onIconClick } = props;

  const iconClickHandler = onIconClick || onTitleClick;

  const scrollRef = useRef(null);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return (
    <div ref={scrollRef} className={styles.scrollContainer}>
      <InfiniteScroll
        ref={scrollRef}
        element='ul'
        hasMore={hasMore}
        loadMore={onScroll}
        useWindow={false}
        getScrollParent={() => findDOMNode(scrollRef.current)}
      >
        {events.map((item, index) => {
          const coordinates = getCoordinatesForEvent(item);
          return <li className={`${styles.listItem} ${styles[`priority-${item.priority}`]}`} key={`${item.id}-${index}`}>
            <button className={styles.icon} onClick={() => iconClickHandler(item)}><EventIcon iconId={item.icon_id} /></button>
            <span className={styles.serialNumber}>{item.serial_number}</span>
            <button type="button" className={styles.title} onClick={() => onTitleClick(item)}>{displayTitleForEventByEventType(item, eventTypes)}</button>
            <DateTime className={styles.date} date={item.updated_at} />
            {coordinates &&
              <div className={styles.jump}>
                <LocationJumpButton coordinates={coordinates} map={map} />
              </div>
            }
          </li>
        })}
        {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more events...</li>}
        {!hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more events to display.</li>}
      </InfiniteScroll>
    </div>
  )
});

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(EventFeed);

EventFeed.defaultProps = {
  onTitleClick(event) {
    console.log('title click', event);
  },
};

EventFeed.propTypes = {
  events: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onScroll: PropTypes.func.isRequired,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  onJumpClick: PropTypes.func,
  map: PropTypes.object.isRequired,
};
