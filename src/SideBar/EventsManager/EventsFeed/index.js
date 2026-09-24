import React, { memo, useContext, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import uniq from 'lodash/uniq';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcTimePropForSortConfig, sortEventsBySortConfig } from '../../../utils/event-filter';
import { FEED_CATEGORY, TrackerContext, trackEventFactory } from '../../../utils/analytics';
import { fetchNextEventFeedPage } from '../../../ducks/events';
import { TAB_KEYS } from '../../../constants';

import DetailViewLoader from '../../DetailViewLoader';
import ErrorBoundary from '../../../ErrorBoundary';
import ErrorMessage from '../../../ErrorMessage';
import EventRow from './EventRow';
import Filters from './Filters';
import { ScrollRestoration, SidebarScrollContext } from '../../../SidebarScrollContext';

import * as styles from './styles.module.scss';

const EMPTY_EVENTS = [];

const eventsFeedTracker = trackEventFactory(FEED_CATEGORY);

// A collection already lists the events it contains, so they are left out.
const excludeContainedEvents = (events) => {
  const containedEventIds = uniq(events
    .filter((event) => !!event.is_collection)
    .flatMap((collection) => collection.contains?.map((containedEvent) => containedEvent.related_event.id) ?? []));

  return events.filter((event) => !containedEventIds.includes(event.id) && !event.is_contained_in?.length);
};

const EventsFeed = ({ eventsFeed }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed' });

  const { scrollRef } = useContext(SidebarScrollContext);

  const feedEvents = eventsFeed.events.results ?? EMPTY_EVENTS;

  const displayTimeProp = calcTimePropForSortConfig(eventsFeed.feedSort);

  const events = useMemo(() => sortEventsBySortConfig(
    eventsFeed.shouldExcludeContained ? excludeContainedEvents(feedEvents) : feedEvents,
    eventsFeed.feedSort
  ), [eventsFeed.feedSort, eventsFeed.shouldExcludeContained, feedEvents]);

  const hasMoreEvents = events.length > 0 && !!eventsFeed.events.next;

  const onLoadMoreEvents = () => {
    if (eventsFeed.events.next) {
      dispatch(fetchNextEventFeedPage(eventsFeed.events.next));
    }
  };

  return <TrackerContext.Provider value={eventsFeedTracker}>
    <ErrorBoundary>
      <div className={styles.eventsFeed}>
        <Filters resultCount={eventsFeed.events.count ?? 0} />

        {!!eventsFeed.events.error && <div className={styles.errorState}>
          <ErrorMessage details={eventsFeed.events.error} message={t('fetchErrorMessage')} />

          <button className={styles.retryButton} onClick={() => eventsFeed.loadFeedEvents()} type="button">
            {t('retryButton')}
          </button>
        </div>}

        {!eventsFeed.events.error && eventsFeed.loadingEventFeed && <DetailViewLoader
          className={styles.loader}
          label={t('loadingLabel')}
        />}

        {!eventsFeed.events.error && !eventsFeed.loadingEventFeed && events.length === 0 && <p
          className={styles.emptyStateMessage}
        >
          {t('emptyStateMessage')}
        </p>}

        {!eventsFeed.events.error && !eventsFeed.loadingEventFeed && events.length > 0 && <ScrollRestoration
          className={styles.eventListScrollContainer}
          namespace={TAB_KEYS.EVENTS}
        >
          <InfiniteScroll
            aria-label={t('eventListLabel')}
            className={styles.eventList}
            element="ul"
            getScrollParent={() => scrollRef.current}
            hasMore={hasMoreEvents}
            loadMore={onLoadMoreEvents}
            useWindow={false}
          >
            {events.map((event) => <EventRow displayTimeProp={displayTimeProp} event={event} key={event.id} />)}

            {hasMoreEvents && <li className={styles.loadingMoreMessage} key="loading-more-events">
              {t('loadingMoreMessage')}
            </li>}
          </InfiniteScroll>
        </ScrollRestoration>}
      </div>
    </ErrorBoundary>
  </TrackerContext.Provider>;
};

export default memo(EventsFeed);
