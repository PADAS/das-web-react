import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';

import { SOURCE_IDS, LAYER_IDS } from '../constants';
import { MAP_LOCATION_SELECTION_MODES } from '../ducks/map-ui';

import { MapContext } from '../App';
import EventGeometryLayer from './';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

let mockStoreData;

describe('The EventGeometry layer', () => {
  let clickMock = jest.fn();
  let map, store;
  let polygonEvent, pointEvent;

  beforeEach(() => {
    polygonEvent = {
      id: 'cool',
      title: 'Cool Event',
      geojson: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [1, 2], [2, 3], [3, 4], [1, 2],
            ],
          ],
        },
      },
    };

    pointEvent = {
      id: 'neat',
      title: 'Neat Event',
      geojson: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [6, 8],
        },
      },
    };

    mockStoreData = {
      view: {
        showReportsOnMap: true,
        timeSliderState: {
          active: false,
        },
        mapLocationSelection: {
          isPickingLocation: true,
          mode: MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY,
          event: polygonEvent,
        },
      },
      data: {
        eventStore: {
          cool: polygonEvent,
          neat: pointEvent,
        },
        eventFilter: {
          filter: {
            date_range: {
              lower: null,
              upper: null,
            },
          },
        },
        eventTypes: [],
        mapEvents: {
          events: ['cool', 'neat'],
        },
      },
    };

    store = mockStore(mockStoreData);

  });

  describe('the source', () => {
    beforeEach(() => {
      map = createMapMock({
        getSource: () => null,
      });

      render(<Provider store={store}>
        <MapContext.Provider value={map}>
          <EventGeometryLayer onClick={clickMock} />
        </MapContext.Provider>
      </Provider>);
    });
    test('adding the source', async () => {
      expect(map.addSource).toHaveBeenCalled();
      expect(map.addSource.mock.calls[0][0]).toEqual(SOURCE_IDS.EVENT_GEOMETRY);
    });

    test('only adding a feature collection of polygons', () => {
      const addSourceData = map.addSource.mock.calls[0][1].data;
      expect(addSourceData.type).toBe('FeatureCollection');
      expect(addSourceData.features.length).toBe(1);

      expect(addSourceData.features[0].geometry).toEqual(polygonEvent.geojson.geometry);
    });
  });

  describe('the layer', () => {
    let rendered;
    beforeEach(() => {
      map = createMapMock();

      rendered = render(<Provider store={store}>
        <MapContext.Provider value={map}>
          <EventGeometryLayer onClick={clickMock} />
        </MapContext.Provider>
      </Provider>);
    });
    test('adding the layer', () => {
      expect(map.addLayer).toHaveBeenCalled();
      expect(map.addLayer.mock.calls[0][0].id).toEqual(LAYER_IDS.EVENT_GEOMETRY_LAYER);
    });

    test('binding a click handler', () => {
      expect(clickMock).not.toHaveBeenCalled();

      map.__test__.fireHandlers('click', LAYER_IDS.EVENT_GEOMETRY_LAYER, {});

      expect(clickMock).toHaveBeenCalled();
    });

    test('filtering out the current event geometry being drawn/edited', () => {
      map.getLayer = jest.fn().mockReturnValue(true);

      rendered.rerender(
        <Provider store={store}>
          <MapContext.Provider value={map}>
            <EventGeometryLayer onClick={clickMock} />
          </MapContext.Provider>
        </Provider>
      );

      expect(map.setFilter).toHaveBeenCalledWith(LAYER_IDS.EVENT_GEOMETRY_LAYER, ['!=', 'id', 'cool']);
    });
  });


});