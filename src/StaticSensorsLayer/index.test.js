import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../App';
import { staticSubjectFeature, staticSubjectFeatureWithoutDefaultValue } from '../__test-helpers/fixtures/subjects';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import StaticSensorsLayer, { DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER } from './';

import { showPopup } from '../ducks/popup';

import * as mapUtils from '../utils/map';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

const { SUBJECT_SYMBOLS, CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const { STATIC_SENSOR } = LAYER_IDS;
let map;

let store = {
  view: {
    simplifyMapDataOnZoom: {
      active: false
    },
    showMapNames: {
      [STATIC_SENSOR]: {
        enabled: false,
      }
    },
    mapClusterConfig: {
      subjects: false,
    },
    timeSliderState: {
      active: false,
    }
  },
};


jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  showPopup: jest.fn(),
  hidePopup: jest.fn(),
}));

describe('adding layers to the map', () => {
  beforeEach(() => {
    map = createMapMock({
      getLayer: jest.fn().mockReturnValue(false),
      getSource: jest.fn().mockReturnValue(true),
    });
  });

  describe('the layer used when clustering is disabled', () => {
    beforeEach(() => {
      render(
        <Provider store={mockStore(store)}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );
    });


    test('adding two layers with unclustered source data', () => {
      expect(map.addLayer).toHaveBeenCalledTimes(2);
      map.addLayer.mock.calls.forEach((call) => {
        const [layerConfig] = call;
        expect(layerConfig.source).toEqual(SUBJECT_SYMBOLS);
      });
    });
  });

  describe('the layer used when clustering is enabled', () => {
    beforeEach(() => {
      render(
        <Provider store={mockStore({ ...store, view: { ...store.view, mapClusterConfig: { subjects: true } } })}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );
    });

    test('adding two layers with clustered source data', () => {
      expect(map.addLayer).toHaveBeenCalledTimes(2);
      map.addLayer.mock.calls.forEach((call) => {
        const [layerConfig] = call;
        expect(layerConfig.source).toEqual(CLUSTERS_SOURCE_ID);
      });
    });

  });

  describe('adding images to the map', () => {

    test('adding the background popup image', () => {
      render(
        <Provider store={mockStore(store)}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );

      expect(map.loadImage).toHaveBeenCalled();
      expect(map.loadImage.mock.calls[0][0]).toEqual(LayerBackground);
    });

    test('adding images for the individual sensor icons when the source data changes', () => {
      map.getLayer.mockReturnValue(true);

      const mockImageAddFn = jest.spyOn(mapUtils, 'addFeatureCollectionImagesToMap');

      map.queryRenderedFeatures.mockReturnValue([staticSubjectFeature]);

      render(
        <Provider store={mockStore(store)}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );


      map.__test__.fireHandlers('sourcedata', { sourceId: SUBJECT_SYMBOLS, sourceDataType: 'data' });

      expect(mockImageAddFn).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [staticSubjectFeature] }, { sdf: true });
    });
  });

  describe('clicking on a stationary subject', () => {
    beforeEach(() => {
      map = createMapMock({
        getLayer: jest.fn().mockReturnValue(true),
        getSource: jest.fn().mockReturnValue(true),
      });

      render(
        <Provider store={mockStore(store)}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );

      showPopup.mockImplementation(() => jest.fn());

      map.queryRenderedFeatures.mockReturnValue([staticSubjectFeature]);
      map.setFilter.mockClear();

      map.__test__.fireHandlers('click', { preventDefault() {}, point: { latitude: 66, longitude: 66 } });
    });

    test('showing the subject popup', () => {
      expect(showPopup).toHaveBeenCalledWith('subject', { geometry: staticSubjectFeature.geometry, properties: staticSubjectFeature.properties, coordinates: staticSubjectFeature.geometry.coordinates, popupAttrsOverride: {
        offset: [0, 0],
      } });
    });

    test.only('setting the map filter to hide the selected subject\'s marker', async () => {
      jest.runAllTimers();

      await waitFor(() => {

        expect(map.setFilter).toHaveBeenCalledTimes(2); /* once for the background layer, once for the symbol layer */

        map.setFilter.mock.calls.forEach((call) => {
          expect(call[1]).toEqual([
            ...DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER,
            ['!=', 'id', staticSubjectFeature.properties.id]
          ]);
        });
      });
    });

    test('a one-time handler is bound to the map for handling map click after selecting a stationary subject', async () => {
      await waitFor(() => {
        expect(map.once).toHaveBeenCalled();
      });
    });

    describe('clicking the map while a stationary subject popup is visible', () => {
      test('changing the filter to a new stationary subject if another is the click target', async () => {
        map.queryRenderedFeatures.mockReset();
        map.queryRenderedFeatures.mockReturnValue([staticSubjectFeatureWithoutDefaultValue]);

        map.__test__.fireHandlers('once', { preventDefault() {}, point: { latitude: 66, longitude: 66 } });
        map.setFilter.mockClear();

        await waitFor(() => {
          map.setFilter.mock.calls.forEach((call) => {
            expect(call[1]).toEqual([
              ...DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER,
              ['!=', 'id', staticSubjectFeatureWithoutDefaultValue.properties.id]
            ]);
          });
        });
      });
    });
  });
});
