import React, { createContext, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import uniq from 'lodash/uniq';
import { Outlet } from 'react-router-dom';

import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../../constants';
import { getFeedEvents } from '../../selectors';
import { openModalForReport } from '../../utils/events';
import {  calcEventFilterForRequest, DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, EVENT_SORT_ORDER_OPTIONS } from '../../utils/event-filter';
import { fetchEventFeed, fetchNextEventFeedPage } from '../../ducks/events';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';
import { showDetailView } from '../../ducks/side-bar';
import { trackEventFactory, FEED_CATEGORY } from '../../utils/analytics';
import useNavigate from '../../hooks/useNavigate';

import { ReactComponent as RefreshIcon } from '../../common/images/icons/refresh-icon.svg';

import DelayedUnmount from '../../DelayedUnmount';
import ErrorBoundary from '../../ErrorBoundary';
import EventFilter from '../../EventFilter';
import ColumnSort from '../../ColumnSort';
import ErrorMessage from '../../ErrorMessage';
import EventFeed from '../../EventFeed';
import ReportDetailView from '../../ReportDetailView';

import styles from './../styles.module.scss';

const { ENABLE_REPORT_NEW_UI, ENABLE_UFA_NAVIGATION_UI, ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

export const ReportsTabContext = createContext();

const feedTracker = trackEventFactory(FEED_CATEGORY);

const ReportsTab = ({
  sidebarOpen,
  events,
  fetchEventFeed,
  userLocationCoords,
  fetchNextEventFeedPage,
  eventFilter,
  map,
  showSideBarDetailView,
  sideBar,
}) => {
  const navigate = useNavigate();

  const [feedSort, setFeedSort] = useState(DEFAULT_EVENT_SORT);
  const [loadingEvents, setEventLoadState] = useState(true);
  const [feedEvents, setFeedEvents] = useState([]);

  const onFeedSortChange = useCallback((newVal) => {
    setFeedSort(newVal);
  }, []);

  const resetFeedSort = useCallback(() => {
    setFeedSort(DEFAULT_EVENT_SORT);
  }, []);

  const optionalFeedProps = useMemo(() => {
    let value = {};

    if (userLocationCoords) {
      value.location = `${userLocationCoords.longitude},${userLocationCoords.latitude}`;
    }

    if (isEqual(eventFilter, INITIAL_FILTER_STATE)) {
      value.exclude_contained = true; /* consolidate reports into their parent incidents if the feed is in a 'default' state, but include them in results if users are searching/filtering for something */
    }
    return value;
  }, [eventFilter, userLocationCoords]);

  const loadFeedEvents = useCallback(() => {
    setEventLoadState(true);
    return fetchEventFeed({}, calcEventFilterForRequest({ params: optionalFeedProps }, feedSort))
      .then(() => {
        setEventLoadState(false);
      });
  }, [feedSort, fetchEventFeed, optionalFeedProps]);

  useEffect(() => {
    loadFeedEvents();
  }, [loadFeedEvents]);

  const onScroll = useCallback(() => {
    if (events.next) {
      fetchNextEventFeedPage(events.next);
    }
  }, [events.next, fetchNextEventFeedPage]);

  const onEventTitleClick = (event) => {
    if (ENABLE_UFA_NAVIGATION_UI && ENABLE_REPORT_NEW_UI) {
      if (ENABLE_URL_NAVIGATION) {
        navigate(event.id);
      } else {
        showSideBarDetailView(TAB_KEYS.REPORTS, { report: event });
      }
    } else {
      openModalForReport(event, map);
    }
    const reportType = event.is_collection ? 'Incident' : 'Event';
    feedTracker.track(`Open ${reportType} Report`, `Event Type:${event.event_type}`);
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
    {ENABLE_URL_NAVIGATION
      ? <ReportsTabContext.Provider value={{ loadingEvents }}>
        <Outlet />
      </ReportsTabContext.Provider>
      : sideBar.currentTab === TAB_KEYS.REPORTS && sideBar.showDetailView && <ReportDetailView
        loadingEvents={loadingEvents}
      />}

    <DelayedUnmount isMounted={sidebarOpen}>
      <ErrorBoundary>
        <div className={`${styles.filterWrapper} ${!ENABLE_UFA_NAVIGATION_UI ? styles.oldNavigationFilterWrapper : ''}`} data-testid='filter-wrapper'>
          <EventFilter className={styles.eventFilter} data-testid='reports-filter' sortConfig={feedSort} onResetAll={resetFeedSort}>
            <ColumnSort className={styles.dateSort} sortOptions={EVENT_SORT_OPTIONS} orderOptions={EVENT_SORT_ORDER_OPTIONS} value={feedSort} onChange={onFeedSortChange}/>
          </EventFilter>
        </div>
      </ErrorBoundary>
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
      />}
    </ErrorBoundary>
  </>;
};

const mapStateToProps = (state) => ({
  eventFilter: state.data.eventFilter,
  events: getFeedEvents(state),
  sideBar: state.view.sideBar,
  userLocationCoords: state?.view?.userLocation?.coords,
});

export default connect(
  mapStateToProps,
  { fetchEventFeed, fetchNextEventFeedPage, showSideBarDetailView: showDetailView }
)(memo(ReportsTab));

ReportsTab.propTypes = {
  fetchEventFeed: PropTypes.func.isRequired,
  fetchNextEventFeedPage: PropTypes.func.isRequired,
  map: PropTypes.object,
  eventFilter: PropTypes.object.isRequired,
  sideBar: PropTypes.shape({
    currentTab: PropTypes.string,
    showDetailView: PropTypes.bool,
  }).isRequired,
  showSideBarDetailView: PropTypes.func.isRequired,
};