import React, { memo, useContext, useMemo } from 'react';
import { Flipped, Flipper } from 'react-flip-toolkit';
import InfiniteScroll from 'react-infinite-scroller';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { calcTimePropForSortConfig, sortEventsBySortConfig } from '../utils/event-filter';
import { TAB_KEYS } from '../constants';

import EventItemContextMenu from '../EventItemContextMenu';
import ReportListItem from '../ReportListItem';
import { ScrollRestoration, SidebarScrollContext } from '../SidebarScrollContext';

import * as styles from './styles.module.scss';

const EventFeed = ({ className = '', events = [], hasMore, loading, onScroll, onTitleClick, sortConfig }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventFeed' });

  const { scrollRef } = useContext(SidebarScrollContext);

  const displayTimeProp = calcTimePropForSortConfig(sortConfig);

  const feedEvents = useMemo(() => sortEventsBySortConfig(events, sortConfig), [events, sortConfig]);

  if (loading) {
    return <div className={styles.loaderWrapper}>
      <MoonLoader />
    </div>;
  }

  return <ScrollRestoration className={`${className} ${styles.scrollContainer}`} namespace={TAB_KEYS.EVENTS}>
    <InfiniteScroll
      element="ul"
      getScrollParent={() => scrollRef.current}
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

        {hasMore && <li className={styles.loadMessage} key={0}>
          {t('loadingMoreReportsItem')}
        </li>}

        {!!feedEvents.length && !hasMore && <li
          className={styles.loadMessage}
          key="no-more-events-to-load"
        >
          {t('noMoreReportsItem')}
        </li>}

        {!feedEvents.length && <li className={styles.loadMessage} key="no-events-to-display">
          {t('noReportsItem')}
        </li>}
      </Flipper>
    </InfiniteScroll>
  </ScrollRestoration>;
};

export default memo(EventFeed);
