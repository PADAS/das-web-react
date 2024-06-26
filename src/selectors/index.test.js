import { point, polygon } from '@turf/helpers';

import { getMapEventFeatureCollection } from './';

describe('Selectors - getMapEventFeatureCollection', () => {
  const mapEventsMock = ['123', '456'];
  const eventStoreMock = {
    '123': { event_type: 'type1', geojson: point([100, 50]) },
    '456': { event_type: 'type2', geojson: polygon([[[20, -12], [20, 12], [-20, -12], [20, -12]]]) },
    '789': { event_type: 'type3', geojson: point([-50, -25]) },
  };
  const eventTypesMock = [{ display: 'type 1', value: 'type1' }, { display: 'type 2', value: 'type2' }];
  const locallyEditedEventMock = { id: '123', geojson: point([70, 50]), title: 'new title' };

  test('Creates a Map feature collection from the mapEvents considering the locally edited event changes', () => {
    const mapEventFeatureCollection = getMapEventFeatureCollection.resultFunc(
      mapEventsMock,
      eventStoreMock,
      eventTypesMock,
      locallyEditedEventMock
    );

    expect(mapEventFeatureCollection.features.length).toEqual(2);
    expect(mapEventFeatureCollection.features[0].geometry.coordinates).toEqual([70, 50]);
    expect(mapEventFeatureCollection.features[1].geometry.coordinates)
      .toEqual([[[20, -12], [20, 12], [-20, -12], [20, -12]]]);
  });

  test('Creates a Map feature collection from the mapEvents injecting the locally edited event', () => {
    locallyEditedEventMock.id = '789';
    const mapEventFeatureCollection = getMapEventFeatureCollection.resultFunc(
      mapEventsMock,
      eventStoreMock,
      eventTypesMock,
      locallyEditedEventMock
    );

    expect(mapEventFeatureCollection.features.length).toEqual(3);
    expect(mapEventFeatureCollection.features[0].geometry.coordinates).toEqual([100, 50]);
    expect(mapEventFeatureCollection.features[1].geometry.coordinates)
      .toEqual([[[20, -12], [20, 12], [-20, -12], [20, -12]]]);
    expect(mapEventFeatureCollection.features[2].geometry.coordinates).toEqual([70, 50]);
  });
});
