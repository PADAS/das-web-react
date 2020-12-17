import isEqual from 'react-fast-compare';
import explode from '@turf/explode';
import bearing from '@turf/bearing';
import { featureCollection }  from '@turf/helpers';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';

import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import { store } from '../index';
import { TRACK_LENGTH_ORIGINS, fetchTracks } from '../ducks/tracks';
import { removeNullAndUndefinedValuesFromObject } from './objects';

/* tracks come in a variety of linestring formats, which we explode into points to generate timepoint layers and heatmap data.
   as such, the exploded version of a track can have duplicate entries ("connection points" between lines), causing strange side effects. the nature of the duplicates
   are dependent on the track source, so this utility function takes a fairly naive but effective approach to de-duping.
*/
export const neighboringPointFeatureIsEqualWithNoBearing = (feature, index, collection) => {
  if (feature.properties.bearing !== 0) return false;

  const next = collection[index + 1];
  const previous = collection[index - 1];

  if (!next && !previous) return false;

  return (next && isEqual(feature.geometry.coordinates, next.geometry.coordinates) // eslint-disable-line no-mixed-operators
    || previous && isEqual(feature.geometry.coordinates, previous.geometry.coordinates)); // eslint-disable-line no-mixed-operators
};



export const convertTrackFeatureCollectionToPoints = feature => {
  if (!feature.features.length) return featureCollection([]);

  const [{ properties: { coordinateProperties } }] = feature.features;
  const pointFeatureCollection = explode(feature);

  const addTimeAndBearingToPointFeature = (item, index, collection) => {
    const returnValue = { ...item };
    const { coordinateProperties:_omittedCoordProps, ...restProperties } = returnValue.properties;

    const measuredBearing = !!collection[index - 1] ? bearing(item.geometry, collection[index - 1].geometry) : 0;

    return {
      ...returnValue,
      properties: {
        ...restProperties,
        time: coordinateProperties.times[index],
        bearing: measuredBearing,
      },
    };
  };


  pointFeatureCollection.features = pointFeatureCollection.features
    .map(addTimeAndBearingToPointFeature)
    .filter((feature, index, collection) => !neighboringPointFeatureIsEqualWithNoBearing(feature, index, collection));

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
  if (from) {
    const fromIndex = findDateIndexInRange(times, from);
    results.from = fromIndex;
  }
  if (until) {
    const untilIndex = findDateIndexInRange(times, until);
    if (
      untilIndex === (times.length - 1)
      && (new Date(times[untilIndex]) - new Date(until) > 0)
    ) {
      results.until = new Date(times[untilIndex]) - new Date(until) > 0 ? times.length : times.length - 1;
    } else if (untilIndex > -1) {
      results.until = untilIndex;
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

export const trackHasDataWithinTimeRange = (track, since = null, until = null) => {
  if (!since && !until) return true;
  const [first] = track.features[0].properties.coordinateProperties.times;
  const last = track.features[0].properties.coordinateProperties.times[track.features[0].properties.coordinateProperties.times.length - 1];
  if (since && (new Date(last) - new Date(since) > 0)) {
    return false;
  }
  if (until && (new Date(first) - new Date(until) < 0)) {
    return false;
  }
  return true;
};

export  const fetchTracksIfNecessary = (ids, cancelToken) => {
  const { data: { tracks, virtualDate, eventFilter }, view: { trackLength, timeSliderState } } = store.getState();

  const { active:timeSliderActive } = timeSliderState;
  
  const results = ids.map((id) => {
    let dateRange;
    const { length, origin:trackLengthOrigin } = trackLength;
    const { lower:eventFilterSince, upper:eventFilterUntil } = eventFilter.filter.date_range;

    if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      dateRange = removeNullAndUndefinedValuesFromObject({ since:eventFilterSince, until:eventFilterUntil });
    } else if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.customLength) {
      dateRange = removeNullAndUndefinedValuesFromObject({ since: timeSliderActive ? eventFilterSince : startOfDay(subDays(virtualDate || new Date(), length)), until: virtualDate });
    }

    if (!tracks[id]) {
      return store.dispatch(fetchTracks(dateRange, cancelToken, id));
    }
    
    const { track } = tracks[id];
  
    if (!trackHasDataWithinTimeRange(track, dateRange.since, dateRange.until)) {
      return store.dispatch(fetchTracks(dateRange, cancelToken, id));
    }
    return Promise.resolve(track);
  });

  return Promise.all(results);
};

export const trimTrackDataToTimeRange = ({ track, points }, from = null, until = null) => {

  const [originalTrack] = track.features;
  if ((!from && !until) || !originalTrack.geometry) return { track, points };

  const indices = findTimeEnvelopeIndices(originalTrack.properties.coordinateProperties.times, from ? new Date(from) : null, until? new Date(until) : until);

  if (window.isNaN(indices.from) && window.isNaN(indices.until)) {
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
  };

/*   return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => {
      const envelope = findTimeEnvelopeIndices(feature.properties.coordinateProperties.times, from, until);
    
      if (window.isNaN(envelope.from) && window.isNaN(envelope.until)) {
        return feature;
      }

      const results = cloneDeep(feature);
      
      results.geometry.coordinates = trimArrayWithEnvelopeIndices(results.geometry.coordinates, envelope);
      results.properties.coordinateProperties.times = trimArrayWithEnvelopeIndices(results.properties.coordinateProperties.times, envelope);

      // if there are no results, return the oldest-known position as the only track point
      if (!results.geometry.coordinates.length && feature.geometry.coordinates.length) {
        const lastIndex = feature.geometry.coordinates.length - 1;
        results.geometry.coordinates = [feature.geometry.coordinates[lastIndex]];
        results.properties.coordinateProperties.times = [results.properties.coordinateProperties.times[lastIndex]];
      }
          
      return results;
    }),
  }; */
};

export const addSocketStatusUpdateToTrack = (tracks, newData) => {
  const { track, points } = tracks;

  const update = { ...newData };

  delete update.mid;
  delete update.trace_id;

  console.log('my update properties were this', update.properties);

  update.properties = merge({}, points.features[0].properties, update.properties);

  console.log('my update properties are now this', update.properties);

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
  
    return {
      track: updatedTrack, points: updatedPoints,
    };
  }
  return tracks;
};