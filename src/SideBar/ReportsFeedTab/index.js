import React, { useContext, useState, useCallback, useEffect, memo } from 'react';
import Button from 'react-bootstrap/Button';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as RefreshIcon } from '../../common/images/icons/refresh-icon.svg';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, EVENT_SORT_ORDER_OPTIONS } from '../../utils/event-filter';
import { DEVELOPMENT_FEATURE_FLAGS } from '../../constants';
import { FEED_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { fetchNextEventFeedPage } from '../../ducks/events';
import { getFeedEvents } from '../../selectors';
import { MapContext } from '../../App';
import { openModalForReport } from '../../utils/events';
import useNavigate from '../../hooks/useNavigate';

import ColumnSort from '../../ColumnSort';
import ErrorBoundary from '../../ErrorBoundary';
import ErrorMessage from '../../ErrorMessage';
import EventFeed from '../../EventFeed';
import EventFilter from '../../EventFilter';

import styles from './../styles.module.scss';

const { ENABLE_REPORT_NEW_UI } = DEVELOPMENT_FEATURE_FLAGS;

const feedTracker = trackEventFactory(FEED_CATEGORY);

const ReportsFeedTab = ({ feedSort, loadFeedEvents, loadingEventFeed, setFeedSort, shouldExcludeContained }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const map = useContext(MapContext);

  const events = useSelector((state) => getFeedEvents(state));

  const [feedEvents, setFeedEvents] = useState([]);

  const resetFeedSort = useCallback(() => setFeedSort(DEFAULT_EVENT_SORT), [setFeedSort]);

  const onScroll = useCallback(
    () => events.next && dispatch(fetchNextEventFeedPage(events.next)),
    [dispatch, events.next]
  );

  const onEventTitleClick = useCallback((event) => {
    if (ENABLE_REPORT_NEW_UI) {
      navigate(event.id);
    } else {
      openModalForReport(event, map);
    }

    feedTracker.track(`Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  }, [map, navigate]);

  useEffect(() => {
    if (!shouldExcludeContained) {
      setFeedEvents(events.results);
    } else {
      /* guard code against new events being pushed into the feed despite not matching the exclude_contained filter. 
      this happens as relationships can be established outside the state awareness of the feed. */
      const containedEventIdsToRemove = uniq(events.results
        .filter(({ is_collection }) => !!is_collection)
        .reduce((accumulator, item) => [
          ...accumulator,
          ...item.contains.map(({ related_event: { id } }) => id),
        ], []));
      setFeedEvents(events.results.filter(event => !containedEventIdsToRemove.includes(event.id)));
    }
  }, [events.results, shouldExcludeContained]);

  return <ErrorBoundary>
    <div className={styles.filterWrapper} data-testid='filter-wrapper'>
      <EventFilter
        className={styles.eventFilter}
        data-testid='reports-filter'
        onResetAll={resetFeedSort}
        sortConfig={feedSort}
      >
        <ColumnSort
          className={styles.dateSort}
          onChange={setFeedSort}
          orderOptions={EVENT_SORT_ORDER_OPTIONS}
          sortOptions={EVENT_SORT_OPTIONS}
          value={feedSort}
        />
      </EventFilter>
    </div>

    {!!events.error && <div className={styles.feedError}>
      <ErrorMessage message='Could not load reports. Please try again.' details={events.error} />
      <Button onClick={loadFeedEvents} type='button' variant='primary'>
        <RefreshIcon />
        Try again
      </Button>
    </div>}

    {!events.error && <EventFeed
      className={styles.sidebarEventFeed}
      events={feedEvents}
      hasMore={!!events.next}
      loading={loadingEventFeed}
      map={map}
      onScroll={onScroll}
      onTitleClick={onEventTitleClick}
      sortConfig={feedSort}
    />}
  </ErrorBoundary>;
};

export default memo(ReportsFeedTab);
