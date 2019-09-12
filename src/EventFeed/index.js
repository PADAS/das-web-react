import React, { useRef, memo } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';

import styles from './styles.module.scss';

const EventFeed = (props) => {
  const { events, hasMore, loading, map, onScroll, onTitleClick, onIconClick } = props;

  const scrollRef = useRef(null);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return (
    <div ref={scrollRef} className={styles.scrollContainer}>
      <InfiniteScroll
        element='ul'
        hasMore={hasMore}
        loadMore={onScroll}
        useWindow={false}
        getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
      >
        {events.map((item, index) =>
          <ReportListItem
            className={styles.listItem}
            map={map}
            report={item}
            key={`${item.id}-${index}`}
            onTitleClick={onTitleClick}
            onIconClick={onIconClick} />
        )}
        {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more events...</li>}
        {!hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more events to display.</li>}
      </InfiniteScroll>
    </div>
  );
};

export default memo(EventFeed);

EventFeed.defaultProps = {
  onTitleClick(event) {
  },
};

EventFeed.propTypes = {
  events: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onScroll: PropTypes.func.isRequired,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  map: PropTypes.object.isRequired,
};
