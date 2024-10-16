import React, { useContext, useState, useCallback, useEffect, memo } from 'react';
import Button from 'react-bootstrap/Button';
import uniq from 'lodash/uniq';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as RefreshIcon } from '../../common/images/icons/refresh-icon.svg';

import {
  EVENT_SORT_ORDER_OPTIONS,
} from '../../utils/event-filter';
import {
  DEFAULT_EVENT_SORT,
  EVENT_SORT_OPTIONS
} from '../../constants';
import { FEED_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { fetchNextEventFeedPage } from '../../ducks/events';
import { MapContext } from '../../App';
import useNavigate from '../../hooks/useNavigate';

import ColumnSort from '../../ColumnSort';
import ErrorBoundary from '../../ErrorBoundary';
import ErrorMessage from '../../ErrorMessage';
import EventFeed from '../../EventFeed';
import EventFilter from '../../EventFilter';

import styles from './../styles.module.scss';

const feedTracker = trackEventFactory(FEED_CATEGORY);

const excludeContainedReports = (events) => {
  const containedEventIdsToRemove = uniq(events
    .filter(({ is_collection }) => !!is_collection)
    .reduce((accumulator, item) => [
      ...accumulator,
      ...item.contains.map(({ related_event: { id } }) => id),
    ], []));

  return events.filter((event) => !containedEventIdsToRemove.includes(event.id)
    && !event.is_contained_in?.length);
};

const ReportsFeedTab = ({ events, feedSort, loadFeedEvents, loadingEventFeed, setFeedSort, shouldExcludeContained }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.reportsFeedTab' });

  const map = useContext(MapContext);

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
    navigate(event.id);

    feedTracker.track(`Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  }, [navigate]);

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
      <ErrorMessage message={t('fetchReportsErrorMessage')} details={events.error} />
      <Button onClick={loadFeedEvents} type='button' variant='primary'>
        <RefreshIcon />
        {t('tryAgainButton')}
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
