import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import uniq from 'lodash/uniq';

import { getFeedEvents } from '../selectors';
import { openModalForReport } from '../utils/events';

import {  calcEventFilterForRequest, DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS } from '../utils/event-filter';
import { fetchEventFeed, fetchNextEventFeedPage } from '../ducks/events';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import styles from './styles.module.scss';

import DelayedUnmount from '../DelayedUnmount';
import ErrorBoundary from '../ErrorBoundary';
import EventFilter from '../EventFilter';
import ColumnSort from '../ColumnSort';
import ErrorMessage from '../ErrorMessage';
import EventFeed from '../EventFeed';

const ReportsTab = (props) => {
  const { sidebarOpen, events, fetchEventFeed, fetchNextEventFeedPage, eventFilter, map, } = props;

  const [feedSort, setFeedSort] = useState(DEFAULT_EVENT_SORT);
  const [loadingEvents, setEventLoadState] = useState(false);
  const [feedEvents, setFeedEvents] = useState([]);

  const onFeedSortChange = useCallback((newVal) => {
    setFeedSort(newVal);
  }, []);

  const resetFeedSort = useCallback(() => {
    setFeedSort(DEFAULT_EVENT_SORT);
  }, []);

  const optionalFeedProps = useMemo(() => {
    let value = {};

    if (isEqual(eventFilter, INITIAL_FILTER_STATE)) {
      value.exclude_contained = true; /* consolidate reports into their parent incidents if the feed is in a 'default' state, but include them in results if users are searching/filtering for something */
    }
    return value;
  }, [eventFilter]);

  const loadFeedEvents = useCallback(() => {
    setEventLoadState(true);
    return fetchEventFeed({}, calcEventFilterForRequest({ params: optionalFeedProps }, feedSort))
      .then(() => {
        setEventLoadState(false);
      });
  }, [feedSort, fetchEventFeed, optionalFeedProps]);

  useEffect(() => {
    loadFeedEvents();
  }, [eventFilter, feedSort]); // eslint-disable-line

  const onScroll = useCallback(() => {
    if (events.next) {
      fetchNextEventFeedPage(events.next);
    }
  }, [events.next, fetchNextEventFeedPage]);

  const onEventTitleClick = (event) => {
    openModalForReport(event, map);
    trackEvent('Feed', `Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  };

  useEffect(() => {
    if (loadingEvents && events.error) {
      setEventLoadState(false);
    }
  }, [events.error, loadingEvents]);

  useEffect(() => {
    if (!optionalFeedProps.exclude_contained) {
      setFeedEvents(events.results);
    }
    else {
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
  }, [events.results, optionalFeedProps.exclude_contained]);


  return <>
    <DelayedUnmount isMounted={sidebarOpen}>
      <ErrorBoundary>
        <div className={styles.filterWrapper} data-testid='filter-wrapper'>
          <EventFilter className={styles.eventFilter} data-testid='reports-filter' sortConfig={feedSort}/>
        </div>
      </ErrorBoundary>
      <div className={styles.sortWrapper}>
        <div className={styles.sortReset}>
          {!isEqual(feedSort, DEFAULT_EVENT_SORT) && <Button className={styles.feedSortResetBtn} onClick={resetFeedSort} size='sm' variant='light'>Reset</Button>}
        </div>
        <ColumnSort className={styles.dateSort} options={EVENT_SORT_OPTIONS} value={feedSort} onChange={onFeedSortChange} />
      </div>
    </DelayedUnmount>

    <ErrorBoundary>
      {!!events.error && <div className={styles.feedError}>
        <ErrorMessage message='Could not load reports. Please try again.' details={events.error} />
        <Button type='button' variant='primary' onClick={loadFeedEvents}>
          <RefreshIcon />
          Try again
        </Button>
      </div>}
      {!events.error && <EventFeed
                className={styles.sidebarEventFeed}
                hasMore={!!events.next}
                map={map}
                loading={loadingEvents}
                sortConfig={feedSort}
                events={feedEvents}
                onScroll={onScroll}
                onTitleClick={onEventTitleClick}
              />
              }
    </ErrorBoundary>
  </>;
};

const mapStateToProps = (state) => ({
  eventFilter: state.data.eventFilter,
  events: getFeedEvents(state),
});

export default connect(mapStateToProps, { fetchEventFeed, fetchNextEventFeedPage, updateEventFilter, resetGlobalDateRange })(memo(ReportsTab));

ReportsTab.propTypes = {
  fetchEventFeed: PropTypes.func.isRequired,
  fetchNextEventFeedPage: PropTypes.func.isRequired,
  map: PropTypes.object,
  eventFilter: PropTypes.object.isRequired,
};