import isEqual from 'react-fast-compare';
import { CancelToken } from 'axios';
import explode from '@turf/explode';
import bearing from '@turf/bearing';
import { featureCollection }  from '@turf/helpers';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';
import dateIsEqual from 'date-fns/is_equal';

import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import store from '../store';
import { TRACK_LENGTH_ORIGINS, fetchTracks } from '../ducks/tracks';
import { removeNullAndUndefinedValuesFromObject } from './objects';

export const convertTrackFeatureCollectionToPoints = feature => {
  if (!feature.features.length) return featureCollection([]);

  const [{ properties: { coordinateProperties } }] = feature.features;
  const pointFeatureCollection = explode(feature);

  const addTimeAndBearingToPointFeature = (item, index, collection) => {
    const returnValue = { ...item };
    // eslint-disable-next-line no-unused-vars
    const { coordinateProperties: _omittedCoordProps, ...restProperties } = returnValue.properties;

    const measuredBearing = !!collection[index - 1] ? bearing(item.geometry, collection[index - 1].geometry) : 0;


    return {
      ...returnValue,
      properties: {
        ...restProperties,
        time: coordinateProperties.times[index],
        bearing: measuredBearing,
        index,
      },
    };
  };


  pointFeatureCollection.features = pointFeatureCollection.features
    .map(addTimeAndBearingToPointFeature);

  return pointFeatureCollection;
};

export const addBearingToTrackPoints = feature => ({
  ...feature,
  features: feature.features.map((item, index, collection) => {
    const measuredBearing = !!collection[index - 1] ? bearing(item.geometry, collection[index - 1].geometry) : 0;
    return {
      ...item,
      properties: {
        ...item.properties,
        bearing: measuredBearing,
      },
    };
  }),
});


const dateIsAtOrAfterDate = (date, targetDate) =>
  new Date(date) - new Date(targetDate) >= 0;

const dateIsAtOrBeforeDate = (date, targetDate) =>
  dateIsAtOrAfterDate(targetDate, date);

const findDateIndexInRange = (times, targetDate, startIndex = 0, endIndex = times.length - 1) => { // binary searching in an array of dates for the first date which is at or after a target date.
  while (startIndex < endIndex) {
    const timeIndex = Math.floor(startIndex + ((endIndex - startIndex) + 1) / 2);

    if (dateIsAtOrAfterDate(times[timeIndex], targetDate)) {
      return findDateIndexInRange(times, targetDate, timeIndex, endIndex);
    }
    else {
      return findDateIndexInRange(times, targetDate, startIndex, timeIndex - 1);
    }
  }
  return (dateIsAtOrAfterDate(times[startIndex], targetDate)) ? startIndex : -1;
};

export const findTimeEnvelopeIndices = (times, from = null, until = null) => {
  const results = {};
  if (!from && !until) return {
    from, until,
  };

  const earliestTime = times[times.length -1];
  const mostRecentTime = times[0];

  if (from) {
    results.from = dateIsAtOrAfterDate(earliestTime, from)
      ? times.length -1
      : findDateIndexInRange(times, from);
  }
  if (until) {
    const untilIndex = dateIsAtOrBeforeDate(mostRecentTime, until)
      ? 0
      : findDateIndexInRange(times, until);

    if (
      times[untilIndex] === earliestTime
      && dateIsAtOrAfterDate(earliestTime, until)
    ) {
      results.until = times.length;
    } else if (untilIndex > -1) {
      results.until = dateIsEqual(new Date(times[untilIndex]), new Date(until)) ? untilIndex :  untilIndex + 1;
    }
  }
  return results;
};

export const trimArrayWithEnvelopeIndices = (collection, envelope = {}) => {
  let results = [...collection];
  const { from, until } = envelope;

  if (!window.isNaN(from)) {
    results = results.slice(0, from + 1);
  }
  if (!window.isNaN(until)) {
    results = results.slice(until, collection.length + 1);
  }
  return results;
};

export const trackHasDataWithinTimeRange = (trackData, since = null, until = null) => {
  if (!since && !until) return true;

  const { fetchedDateRange, track } = trackData;

  const [first] = track.features[0].properties.coordinateProperties.times;
  const last = track.features[0].properties.coordinateProperties.times[track.features[0].properties.coordinateProperties.times.length - 1];


  if (
    since
    && new Date(since).getTime() < new Date(
      first ?
        Math.min(
          new Date(fetchedDateRange.since).getTime(),
          new Date(first).getTime(),
        ) : new Date(fetchedDateRange.since).getTime()
    ).getTime()
  ) {
    return false;
  }

  if (
    until
    && new Date(until).getTime() > new Date(
      last ? Math.max(
        new Date(fetchedDateRange.until).getTime(),
        new Date(last).getTime(),
      ) : new Date(fetchedDateRange.until).getTime()
    ).getTime()) {
    return false;
  }
  return true;
};

const trackFetchState = {};
export  const fetchTracksIfNecessary = (ids, config) => {
  const optionalDateBoundaries = config?.optionalDateBoundaries;
  const { data: { tracks, virtualDate, eventFilter }, view: { trackLength, timeSliderState } } = store.getState();


  const { active: timeSliderActive } = timeSliderState;

  const results = ids.map((id) => {
    let dateRange;

    const { length, origin: trackLengthOrigin } = trackLength;
    const { lower: eventFilterSince, upper: eventFilterUntil } = eventFilter.filter.date_range;

    if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      dateRange = removeNullAndUndefinedValuesFromObject({ since: eventFilterSince, until: eventFilterUntil });
    } else if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.customLength) {
      dateRange = removeNullAndUndefinedValuesFromObject({ since: timeSliderActive ? eventFilterSince : startOfDay(subDays(virtualDate || new Date(), length)), until: virtualDate });
    }

    /* use optional date boundaries to further expand the lower and upper limits of the track request, if necessary, to have maximum necessary data coverage */
    if (!!optionalDateBoundaries) {
      if (!!optionalDateBoundaries.since && !!dateRange.since) {
        dateRange.since = new Date(Math.min(new Date(optionalDateBoundaries.since).getTime(), new Date(dateRange.since).getTime())).toISOString();
      }

      if (!!optionalDateBoundaries.until && !!dateRange.until) {
        dateRange.until = new Date(Math.max(new Date(optionalDateBoundaries.until).getTime(), new Date(dateRange.until).getTime())).toISOString();
      }
    }

    const trackData = tracks[id];

    const buildRequest = () => {
      const cancelToken = CancelToken.source();

      const request = store.dispatch(fetchTracks(dateRange, cancelToken, id))
        .finally(() => delete trackFetchState[id]);

      trackFetchState[id] = {
        cancelToken,
        dateRange,
        request,
      };

      return request;
    };

    const handleFetch = () => {
      if (!trackFetchState[id]) {
        return buildRequest();
      }

      let shouldCancelPriorRequest = false;

      const ongoingRequest = trackFetchState[id];
      const oldRange = ongoingRequest?.dateRange;

      if (!!oldRange?.since && !!dateRange.since) {
        if (new Date(dateRange.since).getTime() < new Date(oldRange.since).getTime()) {
          shouldCancelPriorRequest = true;
        }
      } else if (!!oldRange?.until) {
        if (!dateRange.until
        || new Date(dateRange.until).getTime() > new Date(oldRange.until).getTime()) {
          shouldCancelPriorRequest = true;
        }
      }

      if (shouldCancelPriorRequest) {
        trackFetchState[id].cancelToken.cancel();
        return buildRequest();
      }


    };

    if (!trackData
    || !trackHasDataWithinTimeRange(trackData, dateRange.since, dateRange.until)) {
      return handleFetch();
    }
    return trackData;
  });

  return Promise.all(results);
};

export const trimTrackDataToTimeRange = (trackData, from = null, until = null) => {

  const { track, points, ...rest } = trackData;

  const [originalTrack] = track.features;
  if ((!from && !until) || !originalTrack.geometry) return { track, points };

  const indices = findTimeEnvelopeIndices(originalTrack.properties.coordinateProperties.times, from ? new Date(from) : null, until? new Date(until) : until);

  if (window.isNaN(indices.from) && window.isNaN(indices.until)) {
    return { track, points };
  }

  if (
    indices.from === (originalTrack.properties.coordinateProperties.times.length - 1)
    && indices.until === 0
  ) {
    return { track, points };
  }

  const trackResults = cloneDeep(originalTrack);

  trackResults.geometry.coordinates = trimArrayWithEnvelopeIndices(trackResults.geometry.coordinates, indices);

  trackResults.properties.coordinateProperties.times = trimArrayWithEnvelopeIndices(trackResults.properties.coordinateProperties.times, indices);

  if (!trackResults.geometry.coordinates.length && originalTrack.geometry.coordinates.length) {
    const lastIndex = originalTrack.geometry.coordinates.length - 1;
    trackResults.geometry.coordinates = [originalTrack.geometry.coordinates[lastIndex]];
    trackResults.properties.coordinateProperties.times = [trackResults.properties.coordinateProperties.times[lastIndex]];
  }

  return {
    track: {
      ...track,
      features: [trackResults],
    },
    points: {
      ...points,
      features: trimArrayWithEnvelopeIndices(points.features, indices),
    },
    indices,
    ...rest,
  };

};

export const addSocketStatusUpdateToTrack = (tracks, newData) => {
  const { track, points, ...rest } = tracks;

  const update = { ...newData };

  delete update.mid;
  delete update.trace_id;

  update.properties = merge({}, points.features[0].properties, update.properties);

  const [trackFeature] = track.features;

  if (update.geometry
    && !isEqual(update.geometry.coordinates, trackFeature.geometry.coordinates[0])) {
    const updatedTrack = {
      ...track,
    };
    updatedTrack.features[0].geometry.coordinates.unshift(update.geometry.coordinates);
    updatedTrack.features[0].properties.coordinateProperties.times.unshift(update.properties.coordinateProperties.time);

    const updatedPoints = {
      ...points,
    };

    updatedPoints.features.unshift(update);
    updatedPoints.features[1].properties.bearing = bearing(updatedPoints.features[1].geometry.coordinates, updatedPoints.features[0].geometry.coordinates);

    const withPointIndex = {
      ...updatedPoints,
      features: updatedPoints.features.map((point, index) => ({
        ...point,
        properties: {
          ...point.properties,
          index,
        },
      }))
    };

    return {
      track: updatedTrack, points: withPointIndex, ...rest,
    };
  }
  return tracks;
};
