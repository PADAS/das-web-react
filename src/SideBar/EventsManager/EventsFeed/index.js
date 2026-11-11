import { lazy, memo, Suspense, useContext, useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcTimePropForSortConfig, sortEventsBySortConfig } from '../../../utils/event-filter';
import { fetchNextEventFeedPage } from '../../../ducks/events';
import { selectEventLinkPermissions } from '../../../selectors/event-links';
import { TAB_KEYS } from '../../../constants';
import useEventLinking from '../../../hooks/useEventLinking';

import DelayedUnmount from '../../../DelayedUnmount';
import DetailViewLoader from '../../DetailViewLoader';
import ErrorBoundary from '../../../ErrorBoundary';
import ErrorMessage from '../../../ErrorMessage';
import EventFilter from '../../../EventFilter';
import EventRow from './EventRow';
import LinkEventModal from '../../../LinkEventModal';
import { ScrollRestoration, SidebarScrollContext } from '../../../SidebarScrollContext';
import SortControls from './SortControls';
import useFeedTableView, { useIsListReturning } from '../../../FeedTable/useFeedTableView';

import * as styles from './styles.module.scss';

const EventsTable = lazy(() => import('../../../FeedTable/EventsTable'));

const EMPTY_EVENTS = [];
const LOADING_MORE_SPINNER_SIZE = 20;

// A collection already lists the events it contains, so they are left out.
const excludeContainedEvents = (events) => {
  const containedEventIds = new Set(events
    .filter((event) => !!event.is_collection)
    .flatMap((collection) => collection.contains?.map((containedEvent) => containedEvent.related_event.id) ?? []));

  return events.filter((event) => !containedEventIds.has(event.id) && !event.is_contained_in?.length);
};

const EventsFeed = ({ eventsFeed }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed' });

  const eventLinking = useEventLinking();

  const linkModalEventPermissions = useSelector(
    (state) => selectEventLinkPermissions(state, eventLinking.linkModalEvent)
  );

  const { scrollRef } = useContext(SidebarScrollContext);

  const emptyStateMessageRef = useRef(null);

  const { isTableView } = useFeedTableView();
  const isListReturning = useIsListReturning(isTableView);

  const [tableToolbarContainer, setTableToolbarContainer] = useState(null);

  const feedEvents = eventsFeed.events.results ?? EMPTY_EVENTS;

  // A serial number sort has no time of its own for the rows to show.
  const displayTimeProp = eventsFeed.feedSort[1].value === 'serial_number'
    ? 'updated_at'
    : calcTimePropForSortConfig(eventsFeed.feedSort);

  const events = useMemo(() => sortEventsBySortConfig(
    eventsFeed.shouldExcludeContained ? excludeContainedEvents(feedEvents) : feedEvents,
    eventsFeed.feedSort
  ), [eventsFeed.feedSort, eventsFeed.shouldExcludeContained, feedEvents]);

  const hasMoreEvents = events.length > 0 && !!eventsFeed.events.next;

  // Adding to an incident can drop the row the modal opened from, which would
  // take the focus. InfiniteScroll keeps the node of its list to itself.
  const onLinkModalExited = () => {
    if (!events.some((event) => event.id === eventLinking.linkModalEvent?.id)) {
      (scrollRef.current?.querySelector('ul') ?? emptyStateMessageRef.current)?.focus();
    }
  };

  const onLoadMoreEvents = () => {
    if (eventsFeed.events.next) {
      // A failed page is asked for again on the next scroll.
      dispatch(fetchNextEventFeedPage(eventsFeed.events.next)).catch(() => {});
    }
  };

  return <ErrorBoundary>
    <div className={`${styles.eventsFeed} ${isTableView ? styles.tableView : ''} ${isListReturning ? styles.listReturning : ''}`}>
      <EventFilter isSortable summaryActionsRef={isTableView ? setTableToolbarContainer : undefined}>
        <SortControls isTableView={isTableView} />
      </EventFilter>

      {!!eventsFeed.events.error && <div className={styles.errorState}>
        <ErrorMessage details={eventsFeed.events.error} message={t('fetchErrorMessage')} />

        <button className={styles.retryButton} onClick={() => eventsFeed.loadFeedEvents()} type="button">
          {t('retryButton')}
        </button>
      </div>}

      {!eventsFeed.events.error && isTableView && <Suspense
        fallback={<DetailViewLoader className={styles.loader} label={t('loadingLabel')} />}
      >
        <EventsTable events={events} eventsFeed={eventsFeed} toolbarContainer={tableToolbarContainer} />
      </Suspense>}

      {!eventsFeed.events.error && !isTableView && eventsFeed.loadingEventFeed && <DetailViewLoader
        className={styles.loader}
        label={t('loadingLabel')}
      />}

      {!eventsFeed.events.error && !isTableView && !eventsFeed.loadingEventFeed && events.length === 0 && <p
        className={styles.emptyStateMessage}
        ref={emptyStateMessageRef}
        tabIndex={-1}
      >
        {t('emptyStateMessage')}
      </p>}

      {!eventsFeed.events.error && !isTableView && !eventsFeed.loadingEventFeed && events.length > 0 && <ScrollRestoration
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
          tabIndex={-1}
          useWindow={false}
        >
          {events.map((event) => <EventRow
            displayTimeProp={displayTimeProp}
            event={event}
            isChangingLinks={eventLinking.linkingEventIds.has(event.id)}
            key={event.id}
            onOpenLinkModal={eventLinking.openLinkModal}
            onRemoveFromIncident={eventLinking.removeFromIncident}
            onRemoveFromPatrol={eventLinking.removeFromPatrol}
          />)}

          {hasMoreEvents && <li className={styles.loadingMoreItem} key="loading-more-events">
            <div role="status">
              <MoonLoader aria-hidden color="var(--er-ui-cta-primary)" size={LOADING_MORE_SPINNER_SIZE} />

              <span className="sr-only">{t('loadingMoreLabel')}</span>
            </div>
          </li>}
        </InfiniteScroll>
      </ScrollRestoration>}

      <DelayedUnmount isMounted={eventLinking.isLinkModalOpen}>
        <LinkEventModal
          canCreateIncident={linkModalEventPermissions.canCreateIncident}
          event={eventLinking.linkModalEvent}
          isLinking={eventLinking.isLinking}
          onAdd={eventLinking.addToLinkTarget}
          onCreateIncident={eventLinking.addToNewIncident}
          onExited={onLinkModalExited}
          onHide={eventLinking.closeLinkModal}
          show={eventLinking.isLinkModalOpen}
          type={eventLinking.linkModalType}
        />
      </DelayedUnmount>
    </div>
  </ErrorBoundary>;
};

export default memo(EventsFeed);
