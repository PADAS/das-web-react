import isEqual from 'react-fast-compare';
import explode from '@turf/explode';
import bearing from '@turf/bearing';
import { featureCollection } from '@turf/helpers';
import { subDays } from 'date-fns';
import sortedUniqBy from 'lodash/sortedUniqBy';

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

const mapPointCoordinateTimeToTimeProp = (item, index) => {
  const returnValue = { ...item };
  returnValue.properties.time = item.properties.coordinateProperties.times[index];
  delete returnValue.properties.coordinateProperties;
  return returnValue;
};

export const convertTrackFeatureCollectionToPoints = feature => {
  const pointFeature = addBearingToTrackPoints(explode(feature));
  return ({
    ...pointFeature,
    features: pointFeature.features
      .map(mapPointCoordinateTimeToTimeProp)
      .filter((feature, index, collection) => !neighboringPointFeatureIsEqualWithNoBearing(feature, index, collection)),
  });
};

export const convertArrayOfTracksToFeatureCollection = trackArray => featureCollection(trackArray.reduce((accumulator, array) => [...accumulator, array.features[0]], []));

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

export const convertArrayOfTracksToPointFeatureCollection = trackCollection => trackCollection
  .map(tracks => convertTrackFeatureCollectionToPoints(tracks))
  .reduce((accumulator, featureCollection) => {
    return {
      ...accumulator,
      features: [...accumulator.features, ...featureCollection.features],
    };
  }, featureCollection([]));

export const getSubjectIDFromFirstFeatureInCollection = ({ features }) => features[0].properties.id;

const mergeTrackData = (track, extendedTrackHistory) => {
  const trackCoordTimePairs = createSortedCoordTimePairsForTrack(track);
  const newTrackCoordTimePairs = createSortedCoordTimePairsForTrack(extendedTrackHistory);

  const uniqueValues = removeDuplicatesFromCoordTimePairs([...trackCoordTimePairs, ...newTrackCoordTimePairs]);

  return {
    ...track,
    geometry: {
      ...track.geometry,
      coordinates: uniqueValues.map(({ coordinates }) => coordinates),
      properties: {
        ...track.properties,
        coordinateProperties: {
          ...track.coordinateProperties,
          times: uniqueValues.map(({ time }) => time),
        },
      },
    },
  };
};

const createSortedCoordTimePairsForTrack = (track) => {
  const { features: [{ properties, geometry }] } = track;
  const { coordinateProperties: { times } } = properties;
  const { coordinates } = geometry;
  return sortCoordTimePairs(
    times.map((time, index) => ({
      time, coordinates: coordinates[index],
    }))
  );
};

const sortCoordTimePairs = (pairs) => pairs.sort((pair1, pair2) =>
  new Date(pair1.time) - new Date(pair2.time),
);

const removeDuplicatesFromCoordTimePairs = (pairs) => sortedUniqBy(pairs, 'time');

const dateIsAtOrAfterDate = (date, targetDate) =>
  new Date(date) - new Date(targetDate) >= 0;

const findDateIndexInRange = (times, targetDate, startIndex = 0, endIndex = times.length - 1) => {
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

const findTimeEnvelopeIndices = (times, from = null, until = null) => {
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

export const trimTrackFeatureTimeRange = (track, from = null, until = null) => {
  if (!from && !until) return track;

  const envelope = findTimeEnvelopeIndices(track.properties.coordinateProperties.times, from, until);
    
  if (window.isNaN(envelope.from) && window.isNaN(envelope.until)) {
    return track;
  }
    
  const results = cloneDeep(track);
      
  results.geometry.coordinates = trimWithEnvelope(results.geometry.coordinates, envelope);
  results.properties.coordinateProperties.times = trimWithEnvelope(results.properties.coordinateProperties.times, envelope);
      
  return results;
};

const trimWithEnvelope = (collection, envelope = {}) => {
  const results = [...collection];
  if (envelope.from) {
          
    results.splice((envelope.from + 1), results.length);
  }
  if (envelope.until) {
    results.splice(0, envelope.until);
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

export  const fetchTracksIfNecessary = (id) => {
  const { data: { tracks, virtualDate, eventFilter }, view: { trackLength } } = store.getState();
  const track = tracks[id];

  const { length, origin } = trackLength;
  const { lower:eventFilterSince, upper:eventFilterUntil } = eventFilter.filter.date_range;
  
  let dateRange;

  if (origin === TRACK_LENGTH_ORIGINS.eventFilter) {
    dateRange = removeNullAndUndefinedValuesFromObject({ since:eventFilterSince, until:eventFilterUntil });
  } else  if (origin === TRACK_LENGTH_ORIGINS.customLength) {
    dateRange = removeNullAndUndefinedValuesFromObject({ since: subDays(virtualDate || new Date(), length), until: virtualDate });
  }

  if (!track || !trackHasDataWithinTimeRange(track, dateRange.since, dateRange.until)) {
    return store.dispatch(fetchTracks(dateRange, id));
  }
  return Promise.resolve();
};

export const trimTrackFeatureCollectionToLength = (trackFeatureCollection, lengthInDays) => {
  return {
    ...trackFeatureCollection,
    features: trackFeatureCollection.features.map(track => {
      const [first] = track.properties.coordinateProperties.times;
      return trimTrackFeatureTimeRange(track, subDays(first, lengthInDays));
    }),
  };
};
