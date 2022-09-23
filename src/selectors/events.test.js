import { getMapEventFeatureCollectionByTypeWithVirtualDate } from './events';
import centerOfMass from '@turf/center-of-mass';
import { featureCollection } from '@turf/helpers';

describe('#getMapEventFeatureCollectionByTypeWithVirtualDate', () => {
  const polygonFeature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 1], [1, 2], [2, 3], [0, 1],
        ],
      ],
    },
    properties: {
      id: 1,
    },
  };

  const pointFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [10, 11],
    },
    properties: {
      id: 2,
    },
  };

  const lineFeature = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [100.0, 0.0],
        [101.0, 1.0]
      ]
    },
    properties: {
      id: 3,
    },
  };

  const mockFeatureCollection = {
    type: 'FeatureCollection',
    features: [polygonFeature, pointFeature, lineFeature],
  };

  let mappedByType;

  beforeEach(() => {
    mappedByType = getMapEventFeatureCollectionByTypeWithVirtualDate.resultFunc(mockFeatureCollection);
  });

  test('separating a mixed feature collection by its geometry types', () => {
    expect(mappedByType.Point).toEqual(featureCollection([pointFeature]));
    expect(mappedByType.Polygon).toEqual(featureCollection([polygonFeature]));
    expect(mappedByType.LineString).toEqual(featureCollection([lineFeature]));
  });

  test('adding a collection for polygon features\' centers of mass', () => {
    expect(mappedByType.PolygonCentersOfMass).toEqual(
      featureCollection([
        centerOfMass(
          polygonFeature,
          polygonFeature.properties,
        ),
      ])
    );
  });
});