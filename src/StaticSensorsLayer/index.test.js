import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../App';
import { staticSubjectFeature, staticSubjectFeatureWithoutIcon, staticSubjectFeatureWithoutDefaultValue } from '../__test-helpers/fixtures/subjects';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';
import StaticSensorsLayer, { DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER } from './';

import { hidePopup, showPopup } from '../ducks/popup';

import * as mapUtils from '../utils/map';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

const { SUBJECT_SYMBOLS, CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const { STATIC_SENSOR, SECOND_STATIC_SENSOR_PREFIX, CLUSTERED_STATIC_SENSORS_LAYER, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;
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

  describe('updating layout properties based on map config', () => {
    let data = mockStore(store), reRender;

    beforeEach(() => {
      const { rerender } = render(
        <Provider store={data}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );

      reRender = rerender;

      map.setLayoutProperty.mockClear();
      expect(map.setLayoutProperty).not.toHaveBeenCalled();
    });

    test('updating layout when map data simplification is toggled', async () => {
      data = mockStore(() => ({
        ...store,
        view: {
          ...store.view,
          simplifyMapDataOnZoom: {
            active: true
          },
        }
      }));

      reRender(<Provider store={data}>
        <MapContext.Provider value={map}>
          <StaticSensorsLayer isTimeSliderActive={false} />
        </MapContext.Provider>
      </Provider>);

      await waitFor(() => {
        expect(map.setLayoutProperty).toHaveBeenCalled();
      });
    });

    test('updating layout when the timeslider state is toggled', async () => {
      reRender(<Provider store={data}>
        <MapContext.Provider value={map}>
          <StaticSensorsLayer isTimeSliderActive={true} />
        </MapContext.Provider>
      </Provider>);

      await waitFor(() => {
        expect(map.setLayoutProperty).toHaveBeenCalled();
      });
    });

    test('updating layout when statonary subject name visibility is toggled', async () => {
      data = mockStore(() => ({
        ...store,
        view: {
          ...store.view,
          showMapNames: {
            [STATIC_SENSOR]: {
              enabled: true,
            }
          },
        }
      }));

      reRender(<Provider store={data}>
        <MapContext.Provider value={map}>
          <StaticSensorsLayer isTimeSliderActive={true} />
        </MapContext.Provider>
      </Provider>);

      await waitFor(() => {
        expect(map.setLayoutProperty).toHaveBeenCalled();
      });
    });
  });

  describe('clicking on a stationary subject', () => {
    // let hidePopupMock, showPopupMock;
    beforeEach(() => {
      render(
        <Provider store={mockStore(store)}>
          <MapContext.Provider value={map}>
            <StaticSensorsLayer isTimeSliderActive={false} />
          </MapContext.Provider>
        </Provider>
      );

      jest.mock('../ducks/popup', () => ({
        ...jest.requireActual('../ducks/popup'),
        addPopup: jest.fn(),
        hidePopup: jest.fn(),
      }));

      map.queryRenderedFeatures.mockReturnValue(staticSubjectFeature);

      map.__test__.fireHandlers('click', { preventDefault() {}, point: { latitude: 66, longitude: 66 } });
    });

    test('showing the subject popup', () => {
      expect(showPopup).toHaveBeenCalledWith('subject', { geometry: staticSubjectFeature.geometry, properties: staticSubjectFeature.properties, coordinates: staticSubjectFeature.geometry.coordinates, popupAttrsOverride: {
        offset: [0, 0],
      } });
    });

    test('setting the map filter to hide the selected subject\'s marker', () => {
      expect(map.setFilter).toHaveBeenCalledWith([
        ...DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER,
        ['!=', 'id', staticSubjectFeature.properties.id]
      ]);
    });

    describe('clicking the map while a stationary subject popup is visible', () => {
      test('changing the filter to a new stationary subject if another is the click target', () => {

      });

      test('setting the filter back to default if another stationary subject is not the click target', () => {

      });
    });
  });
});