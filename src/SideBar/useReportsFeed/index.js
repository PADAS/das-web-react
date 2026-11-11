import { useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { isCancel } from 'axios';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';

import { calcEventFilterForRequest } from '../../utils/event-filter';
import { calcLocationParamStringForUserLocationCoords } from '../../utils/location';
import { fetchEventFeed, fetchEventFeedCancelToken } from '../../ducks/events';
import { getFeedEvents } from '../../selectors';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';
import { objectToParamString } from '../../utils/query';
import { TAB_KEYS } from '../../constants';
import { userIsGeoPermissionRestricted } from '../../utils/geo-perms';
import useFeedTableView from '../../FeedTable/useFeedTableView';

const EVENT_FEED_PAGE_SIZE = 50;

const useReportsFeed = () => {
  const dispatch = useDispatch();

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const events = useSelector((state) => getFeedEvents(state));
  const userIsGeoPermRestricted = useSelector((state) => userIsGeoPermissionRestricted(state?.data?.user));
  const userLocationCoords = useSelector((state) => state?.view?.userLocation?.coords);
  const feedSort = eventFilter.filter.sort;

  // The table gives each field of a single event type its own column.
  const { isTableView } = useFeedTableView(TAB_KEYS.EVENTS);
  const includeDetails = isTableView && eventFilter.filter.event_type.length === 1;

  const [feedRequest, setFeedRequest] = useState({ id: 0, params: null });
  const [loadingEventFeed, setEventLoadState] = useState(true);

  // The list nests an incident's events under it; the table has a row for each.
  const shouldExcludeContained = useMemo(() => {
    const { _persist, ...restEventFilter } = eventFilter;

    return !isTableView && isEqual(restEventFilter, INITIAL_FILTER_STATE);
  }, [eventFilter, isTableView]);
  const eventParams = useRef(calcEventFilterForRequest({
    params: {
      exclude_contained: shouldExcludeContained,
      include_details: false,
      include_files: false,
      include_notes: false,
      include_updates: false,
      page_size: EVENT_FEED_PAGE_SIZE,
    },
    format: 'object',
  }, feedSort));

  const geoResrictedUserLocationCoords = useMemo(
    () => userIsGeoPermRestricted && userLocationCoords,
    [userIsGeoPermRestricted, userLocationCoords]
  );

  // Using this ref during render is intended.
  // eslint-disable-next-line react-hooks/refs
  const loadFeedEvents = useMemo(() => debounce((silent = false) => {
    if (!silent) {
      setEventLoadState(true);
    }
    setFeedRequest((currentFeedRequest) => ({ id: currentFeedRequest.id + 1, params: eventParams.current }));

    return dispatch(fetchEventFeed({}, objectToParamString(eventParams.current)))
      .catch((error) => {
        if (!isCancel(error)) {
          console.warn('Failed to fetch the event feed', error);
        }
      })
      .finally(() => setEventLoadState(false));
  }), [dispatch]);

  useEffect(() => {
    if (geoResrictedUserLocationCoords) {
      eventParams.current = {
        ...eventParams.current,
        location: calcLocationParamStringForUserLocationCoords(geoResrictedUserLocationCoords),
      };
    }

    loadFeedEvents(true);

    return () => fetchEventFeedCancelToken.cancel();
  }, [geoResrictedUserLocationCoords, loadFeedEvents]);

  useEffect(() => {
    const params = {
      include_details: includeDetails,
      include_files: false,
      include_notes: false,
      include_updates: false,
      page_size: EVENT_FEED_PAGE_SIZE,
    };
    if (shouldExcludeContained) {
      params.exclude_contained = true;
    }

    if (eventParams.current.location) {
      params.location = cloneDeep(eventParams.current.location);
    }

    eventParams.current = { ...calcEventFilterForRequest({ params, format: 'object' }, feedSort) };

    loadFeedEvents();

    return () => fetchEventFeedCancelToken.cancel();
  }, [feedSort, eventFilter, includeDetails, loadFeedEvents, shouldExcludeContained]);

  useEffect(() => {
    if (loadingEventFeed && events.error) {
      // Updating state from this effect is intended.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEventLoadState(false);
    }
  }, [events.error, loadingEventFeed]);

  // The events feed is memoized, so it needs the same object between changes.
  return useMemo(
    () => ({ events, feedRequest, feedSort, loadFeedEvents, loadingEventFeed, shouldExcludeContained }),
    [events, feedRequest, feedSort, loadFeedEvents, loadingEventFeed, shouldExcludeContained]
  );
};

export default useReportsFeed;
