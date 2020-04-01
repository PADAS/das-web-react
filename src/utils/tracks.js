import isEqual from 'react-fast-compare';
import explode from '@turf/explode';
import bearing from '@turf/bearing';
import { featureCollection }  from '@turf/helpers';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';

import cloneDeep from 'lodash/cloneDeep';
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

  const mapPointCoordinateTimeToTimeProp = (item, index) => {
    const returnValue = { ...item };
    delete returnValue.properties.coordinateProperties;

    return {
      ...returnValue,
      properties: {
        ...returnValue.properties,
        time: coordinateProperties.times[index],
        bearing: coordinateProperties.coordinateBearings[index],
      },
    };
  };

  pointFeatureCollection.features = pointFeatureCollection.features
    .map(mapPointCoordinateTimeToTimeProp)
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
    if (fromIndex > -1) {
      results.from = fromIndex;
    }
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
  if (envelope.from) {
    results = results.slice(0, envelope.from + 1);
  }
  if (envelope.until) {
    results = results.slice(envelope.until, collection.length + 1);
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
    const track = tracks[id];
  
    const { length, origin:trackLengthOrigin } = trackLength;
    const { lower:eventFilterSince, upper:eventFilterUntil } = eventFilter.filter.date_range;
    
    let dateRange;
  
    if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      dateRange = removeNullAndUndefinedValuesFromObject({ since:eventFilterSince, until:eventFilterUntil });
    } else if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.customLength) {
      dateRange = removeNullAndUndefinedValuesFromObject({ since: timeSliderActive ? eventFilterSince : startOfDay(subDays(virtualDate || new Date(), length)), until: virtualDate });
    }
  
    if (!track || !trackHasDataWithinTimeRange(track, dateRange.since, dateRange.until)) {
      return store.dispatch(fetchTracks(dateRange, cancelToken, id));
    }
    return Promise.resolve(track);
  });

  return Promise.all(results);
};

export const trimTrackFeatureCollectionToTimeRange = (featureCollection, from = null, until = null) => {
  if (!from && !until) return featureCollection;

  return {
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
  };

};

export const addBearingToTrackFeatureCollectionCoordinateProperties = featureCollection => {
  return {
    ...featureCollection,
    features: featureCollection.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        coordinateProperties: {
          ...feature.properties.coordinateProperties,
          coordinateBearings: feature.geometry.coordinates.map((coord, index, collection) => !!collection[index - 1] ? bearing(coord, collection[index - 1]) : 0),
        }
      }
    }))
  };
};

export const addSocketStatusUpdateToTrack = (tracks, update) => {
  const [trackFeature] = tracks.features;

  if (update.geometry
    && !isEqual(update.geometry.coordinates, trackFeature.geometry.coordinates[0])) {
    const withNewPoint = {
      ...tracks,
    };
    withNewPoint.features[0].geometry.coordinates.unshift(update.geometry.coordinates);
    withNewPoint.features[0].properties.coordinateProperties.times.unshift(update.properties.coordinateProperties.time);
    withNewPoint.features[0].properties.coordinateProperties.coordinateBearings.splice(1, 0, bearing(withNewPoint.features[0].geometry.coordinates[1], withNewPoint.features[0].geometry.coordinates[0]));
  
    return withNewPoint;
  }
  return tracks;
};