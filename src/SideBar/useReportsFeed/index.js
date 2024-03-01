import { useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';

import { calcEventFilterForRequest, DEFAULT_EVENT_SORT } from '../../utils/event-filter';
import { calcLocationParamStringForUserLocationCoords } from '../../utils/location';
import { fetchEventFeed, fetchEventFeedCancelToken } from '../../ducks/events';
import { getFeedEvents } from '../../selectors';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';
import { objectToParamString } from '../../utils/query';
import { userIsGeoPermissionRestricted } from '../../utils/geo-perms';

const useReportsFeed = () => {
  const dispatch = useDispatch();

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const events = useSelector((state) => getFeedEvents(state));
  const userIsGeoPermRestricted = useSelector((state) => userIsGeoPermissionRestricted(state?.data?.user));
  const userLocationCoords = useSelector((state) => state?.view?.userLocation?.coords);

  const [feedSort, setFeedSort] = useState(DEFAULT_EVENT_SORT);
  const [loadingEventFeed, setEventLoadState] = useState(true);

  const shouldExcludeContained = useMemo(() => {
    const { _persist, ...restEventFilter } = eventFilter;

    return isEqual(restEventFilter, INITIAL_FILTER_STATE);
  }, [eventFilter]);
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

  return {
    events,
    feedSort,
    loadFeedEvents,
    loadingEventFeed,
    setFeedSort,
    shouldExcludeContained,
  };
};

export default useReportsFeed;
