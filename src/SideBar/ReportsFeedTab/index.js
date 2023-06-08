import React, { useContext, useState, useCallback, useEffect, memo } from 'react';
import Button from 'react-bootstrap/Button';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as RefreshIcon } from '../../common/images/icons/refresh-icon.svg';

import {
  DEFAULT_EVENT_SORT,
  EVENT_SORT_OPTIONS,
  EVENT_SORT_ORDER_OPTIONS,
} from '../../utils/event-filter';
import { FEATURE_FLAG_LABELS } from '../../constants';
import { FEED_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { fetchNextEventFeedPage } from '../../ducks/events';
import { getFeedEvents } from '../../selectors';
import { MapContext } from '../../App';
import { openModalForReport } from '../../utils/events';
import { useFeatureFlag } from '../../hooks';

import ColumnSort from '../../ColumnSort';
import ErrorBoundary from '../../ErrorBoundary';
import ErrorMessage from '../../ErrorMessage';
import EventFeed from '../../EventFeed';
import EventFilter from '../../EventFilter';

import styles from './../styles.module.scss';
import useNavigationSet from '../../hooks/useNavigationSet';

const { ENABLE_REPORT_NEW_UI } = FEATURE_FLAG_LABELS;

const feedTracker = trackEventFactory(FEED_CATEGORY);

const excludeContainedReports = (events) => {
  const containedEventIdsToRemove = uniq(events
    .filter(({ is_collection }) => !!is_collection)
    .reduce((accumulator, item) => [
      ...accumulator,
      ...item.contains.map(({ related_event: { id } }) => id),
    ], []));

  return events.filter(event => !containedEventIdsToRemove.includes(event.id));
};

const ReportsFeedTab = ({ feedSort, loadFeedEvents, loadingEventFeed, setFeedSort, shouldExcludeContained }) => {
  const dispatch = useDispatch();
  const { navigate, navigationState } = useNavigationSet();
  const enableNewReportUI = useFeatureFlag(ENABLE_REPORT_NEW_UI);
  const map = useContext(MapContext);

  const events = useSelector((state) => getFeedEvents(state));

  const [feedEvents, setFeedEvents] = useState(() => {
    if (events.results?.length) {
      if (shouldExcludeContained) {
        return excludeContainedReports(events.results);
      }
      return events.results;
    }
    return [];
  });

  const resetFeedSort = useCallback(() => setFeedSort(DEFAULT_EVENT_SORT), [setFeedSort]);

  const onScroll = useCallback(
    () => {
      events.next && dispatch(fetchNextEventFeedPage(events.next));
    },
    [dispatch, events.next]
  );

  const onEventTitleClick = useCallback((event) => {
    if (enableNewReportUI) {
      navigate(event.id, { state: navigationState });
    } else {
      openModalForReport(event, map);
    }

    feedTracker.track(`Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  }, [enableNewReportUI, map, navigate, navigationState]);

  useEffect(() => {
    setFeedEvents(shouldExcludeContained ? excludeContainedReports(events.results) : events.results);
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
      hasMore={!!feedEvents.length && !!events.next}
      loading={loadingEventFeed}
      map={map}
      onScroll={onScroll}
      onTitleClick={onEventTitleClick}
      sortConfig={feedSort}
    />}
  </ErrorBoundary>;
};

export default memo(ReportsFeedTab);
