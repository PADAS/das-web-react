import React, { memo, useMemo, useContext } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import { Flipper, Flipped } from 'react-flip-toolkit';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';
import EventItemContextMenu from '../EventItemContextMenu';
import { calcTimePropForSortConfig, sortEventsBySortConfig } from '../utils/event-filter';
import { ScrollContext, ScrollRestoration } from '../ScrollContext';

import styles from './styles.module.scss';

const EventFeed = (props) => {
  const { className = '', events = [], sortConfig, hasMore, loading, onScroll, onTitleClick, onIconClick } = props;
  const { scrollRef } = useContext(ScrollContext);

  const feedEvents = useMemo(() => sortEventsBySortConfig(events, sortConfig), [events, sortConfig]);
  const displayTimeProp = calcTimePropForSortConfig(sortConfig);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <ScrollRestoration namespace='reports' className={`${className} ${styles.scrollContainer}`}>
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
            <EventItemContextMenu report={item} className={styles.contextMenu}>
              <ReportListItem
                    displayTime={item[displayTimeProp]}
                    report={item}
                    onTitleClick={onTitleClick}
                    onIconClick={onIconClick} />
            </EventItemContextMenu>
          </Flipped>
          )}
        {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more reports...</li>}
        {!!feedEvents.length && !hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more reports to display.</li>}
        {!feedEvents.length && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-events-to-display'>No reports to display.</li>}
      </Flipper>
    </InfiniteScroll>
  </ScrollRestoration>;
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
