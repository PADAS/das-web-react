import React, { useRef, memo } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import { Flipper, Flipped } from 'react-flip-toolkit';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';

import styles from './styles.module.scss';

const EventFeed = (props) => {
  const { className = '', events, hasMore, loading, map, onScroll, onTitleClick, onIconClick } = props;

  const scrollRef = useRef(null);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return (
    <div ref={scrollRef} className={`${className} ${styles.scrollContainer}`}>
      <InfiniteScroll
        element='ul'
        hasMore={hasMore}
        loadMore={onScroll}
        useWindow={false}
        getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
      >
        <Flipper flipKey={events}>
          {events.map((item, index) =>
            <Flipped flipId={item.id} key={item.id}>
              <ReportListItem
                className={styles.listItem}
                map={map}
                report={item}
                onTitleClick={onTitleClick}
                onIconClick={onIconClick} />
            </Flipped>
          )}
          {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more reports...</li>}
          {!!events.length && !hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more reports to display.</li>}
          {!events.length && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-events-to-display'>No reports to display.</li>}
        </Flipper>
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
