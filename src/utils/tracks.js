import isEqual from 'react-fast-compare';
import explode from '@turf/explode';
import bearing from '@turf/bearing';
import { featureCollection } from '@turf/helpers';

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

export const convertTrackLineStringToPoints = feature => {
  const pointFeature = addBearingToTrackPoints(explode(feature));
  return ({
    ...pointFeature,
    features: pointFeature.features
      .map(mapPointCoordinateTimeToTimeProp)
      .filter((feature, index, collection) => !neighboringPointFeatureIsEqualWithNoBearing(feature, index, collection)),
  });
};

export const convertArrayOfTracksIntoFeatureCollection = trackArray => featureCollection(trackArray.reduce((accumulator, array) => [...accumulator, array.features[0]], []));

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
  .map(tracks => convertTrackLineStringToPoints(tracks))
  .reduce((accumulator, featureCollection) => {
    return {
      ...accumulator,
      features: [...accumulator.features, ...featureCollection.features],
    };
  }, featureCollection([]));

export const getSubjectIDFromFirstFeatureInCollection = ({ features }) => features[0].properties.id;