import React, { memo, useContext, useMemo } from 'react';
import { findDOMNode } from 'react-dom';
import { Flipped, Flipper } from 'react-flip-toolkit';
import InfiniteScroll from 'react-infinite-scroller';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { calcTimePropForSortConfig, sortEventsBySortConfig } from '../utils/event-filter';
import { TAB_KEYS } from '../constants';

import EventItemContextMenu from '../EventItemContextMenu';
import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';
import { ScrollRestoration, SidebarScrollContext } from '../SidebarScrollContext';

import styles from './styles.module.scss';

const EventFeed = ({ className, events, hasMore, loading, onScroll, onTitleClick, sortConfig }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventFeed' });

  const { scrollRef } = useContext(SidebarScrollContext);

  const displayTimeProp = calcTimePropForSortConfig(sortConfig);

  const feedEvents = useMemo(() => sortEventsBySortConfig(events, sortConfig), [events, sortConfig]);

  if (loading) {
    return <LoadingOverlay className={styles.loadingOverlay} />;
  }

  return <ScrollRestoration className={`${className} ${styles.scrollContainer}`} namespace={TAB_KEYS.REPORTS}>
    <InfiniteScroll
      element="ul"
      getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
      hasMore={hasMore}
      loadMore={onScroll}
      useWindow={false}
    >
      <Flipper flipKey={feedEvents}>
        {feedEvents.map((item) => <Flipped flipId={item.id} key={item.id}>
          <EventItemContextMenu className={styles.contextMenu} report={item}>
            <ReportListItem
              displayTime={item[displayTimeProp]}
              onTitleClick={onTitleClick}
              report={item}
            />
          </EventItemContextMenu>
        </Flipped>)}

        {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>
          {t('loadingMoreReportsItem')}
        </li>}

        {!!feedEvents.length && !hasMore && <li
          className={`${styles.listItem} ${styles.loadMessage}`}
          key="no-more-events-to-load"
        >
          {t('noMoreReportsItem')}
        </li>}

        {!feedEvents.length && <li className={`${styles.listItem} ${styles.loadMessage}`} key="no-events-to-display">
          {t('noReportsItem')}
        </li>}
      </Flipper>
    </InfiniteScroll>
  </ScrollRestoration>;
};

EventFeed.defaultProps = {
  className: '',
  events: [],
};

EventFeed.propTypes = {
  className: PropTypes.string,
  events: PropTypes.array,
  hasMore: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  onScroll: PropTypes.func.isRequired,
  onTitleClick: PropTypes.func.isRequired,
  sortConfig: PropTypes.array.isRequired,
};

export default memo(EventFeed);
