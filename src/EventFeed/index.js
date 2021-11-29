import React, { useRef, memo, useMemo } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import { Flipper, Flipped } from 'react-flip-toolkit';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';

import { calcTimePropForSortConfig, sortEventsBySortConfig } from '../utils/event-filter';

import styles from './styles.module.scss';

const EventFeed = (props) => {
  const { className = '', events = [], sortConfig, hasMore, loading, map, onScroll, onTitleClick, onIconClick } = props;

  const scrollRef = useRef(null);
  const feedEvents = useMemo(() => sortEventsBySortConfig(events, sortConfig), [events, sortConfig]);
  const displayTimeProp = calcTimePropForSortConfig(sortConfig);

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
        <Flipper flipKey={feedEvents}>
          {feedEvents.map((item) =>
            <Flipped flipId={item.id} key={item.id}>
              <ReportListItem
                className={styles.listItem}
                displayTime={item[displayTimeProp]}
                map={map}
                report={item}
                onTitleClick={onTitleClick}
                onIconClick={onIconClick} />
            </Flipped>
          )}
          {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more reports...</li>}
          {!!feedEvents.length && !hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more reports to display.</li>}
          {!feedEvents.length && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-events-to-display'>No reports to display.</li>}
        </Flipper>
      </InfiniteScroll>
    </div>
  );
};

export default memo(EventFeed);

EventFeed.defaultProps = {
  onTitleClick() {
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
  sortConfig: PropTypes.array.isRequired,
};
