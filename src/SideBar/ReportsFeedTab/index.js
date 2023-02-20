import React, { useRef, useContext, useState, useCallback, useEffect, useMemo, memo } from 'react';
import Button from 'react-bootstrap/Button';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as RefreshIcon } from '../../common/images/icons/refresh-icon.svg';

import {
  calcEventFilterForRequest,
  DEFAULT_EVENT_SORT,
  EVENT_SORT_OPTIONS,
  EVENT_SORT_ORDER_OPTIONS,
} from '../../utils/event-filter';
import { calcLocationParamStringForUserLocationCoords } from '../../utils/location';
import { FEATURE_FLAG_LABELS } from '../../constants';
import { FEED_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { fetchEventFeed, fetchEventFeedCancelToken, fetchNextEventFeedPage } from '../../ducks/events';
import { getFeedEvents } from '../../selectors';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';
import { MapContext } from '../../App';
import { openModalForReport } from '../../utils/events';
import { objectToParamString } from '../../utils/query';
import { useFeatureFlag } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';
import { userIsGeoPermissionRestricted } from '../../utils/geo-perms';

import ColumnSort from '../../ColumnSort';
import ErrorBoundary from '../../ErrorBoundary';
import ErrorMessage from '../../ErrorMessage';
import EventFeed from '../../EventFeed';
import EventFilter from '../../EventFilter';

import styles from './../styles.module.scss';

const { ENABLE_REPORT_NEW_UI } = FEATURE_FLAG_LABELS;

const feedTracker = trackEventFactory(FEED_CATEGORY);

const ReportsFeedTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const enableNewReportUI = useFeatureFlag(ENABLE_REPORT_NEW_UI);

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const events = useSelector((state) => getFeedEvents(state));
  const userIsGeoPermRestricted = useSelector((state) => userIsGeoPermissionRestricted(state?.data?.user));
  const userLocationCoords = useSelector((state) => state?.view?.userLocation?.coords);

  const map = useContext(MapContext);

  const [feedSort, setFeedSort] = useState(DEFAULT_EVENT_SORT);
  const [loadingEventFeed, setEventLoadState] = useState(true);
  const [feedEvents, setFeedEvents] = useState([]);

  const shouldExcludeContained = useMemo(() => isEqual(eventFilter, INITIAL_FILTER_STATE), [eventFilter]);
  const eventParams = useRef(calcEventFilterForRequest(
    { params: { exclude_contained: shouldExcludeContained }, format: 'object' },
    feedSort
  ));

  const geoResrictedUserLocationCoords = useMemo(
    () => userIsGeoPermRestricted && userLocationCoords,
    [userIsGeoPermRestricted, userLocationCoords]
  );

  const loadFeedEvents = useMemo(() => debounce((silent = false) => {
    if (!silent) {
      setEventLoadState(true);
    }

    return dispatch(fetchEventFeed({}, objectToParamString(eventParams.current)))
      .finally(() => setEventLoadState(false));
  }), [dispatch]);

  const resetFeedSort = useCallback(() => setFeedSort(DEFAULT_EVENT_SORT), []);

  const onScroll = useCallback(
    () => events.next && dispatch(fetchNextEventFeedPage(events.next)),
    [dispatch, events.next]
  );

  const onEventTitleClick = useCallback((event) => {
    if (enableNewReportUI) {
      navigate(event.id);
    } else {
      openModalForReport(event, map);
    }

    feedTracker.track(`Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  }, [enableNewReportUI, map, navigate]);

  useEffect(() => {
    if (geoResrictedUserLocationCoords) {
      eventParams.current = {
        ...eventParams.current,
        location: calcLocationParamStringForUserLocationCoords(geoResrictedUserLocationCoords),
      };
    }

    loadFeedEvents(true);

    return () => fetchEventFeedCancelToken.cancel();;
  }, [geoResrictedUserLocationCoords, loadFeedEvents]);

  useEffect(() => {
    const params = {};
    if (shouldExcludeContained) {
      params.exclude_contained = true;
    }

    if (eventParams.current.location) {
      params.location = cloneDeep(eventParams.current.location);
    }

    eventParams.current = { ...calcEventFilterForRequest({ params, format: 'object' }, feedSort) };

    loadFeedEvents();

    return () => fetchEventFeedCancelToken.cancel();
  }, [feedSort, eventFilter, loadFeedEvents, shouldExcludeContained]);

  useEffect(() => {
    if (loadingEventFeed && events.error) {
      setEventLoadState(false);
    }
  }, [events.error, loadingEventFeed]);

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
