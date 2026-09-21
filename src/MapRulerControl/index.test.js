import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { GPS_FORMATS } from '../utils/location';
import { LAYER_IDS, SOURCE_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../MapContext';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';
import { useMatchMedia } from '../hooks';
import { act, render, screen, waitFor } from '../test-utils';

import MapRulerControl from './';

const popupDomContent = [];

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    addTo() {}
    on() {}
    remove() {}
    setDOMContent(domContent) { popupDomContent.push(domContent); }
    setLngLat() {}
    setOffset() {}
  },
}));

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useMatchMedia: jest.fn(),
}));

jest.mock('../AddItemButton', () => () => null);

const store = {
  data: {},
  view: {
    coordinateReferenceSystems: {
      selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
      storedSystems: [],
    },
    userPreferences: { gpsFormat: GPS_FORMATS.DEG },
  },
};

const MAP_CLICK_SETTLE_TIME = 200;

describe('MapRulerControl', () => {
  let map, sourceData;

  const renderRuler = (children = <MapRulerControl />) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        {children}
      </MapContext.Provider>
    </Provider>
  );

  const activate = () => userEvent.click(screen.getByRole('button', { name: 'Map ruler' }));

  const clickMapAt = async (lng, lat) => act(async () => {
    map.__test__.fireHandlers('click', { lngLat: { lng, lat }, point: [lng, lat] });

    await new Promise((resolve) => setTimeout(resolve, MAP_CLICK_SETTLE_TIME));
  });

  const moveCursorTo = (lng, lat) => act(() => {
    map.__test__.fireHandlers('mousemove', { lngLat: { lng, lat }, point: [lng, lat] });
  });

  const drawTriangle = async () => {
    await activate();
    await clickMapAt(0, 0);
    await clickMapAt(1, 0);
    moveCursorTo(1, 1);
  };

  const findPopupWithText = (text) => popupDomContent.filter((content) => content.textContent.includes(text));

  beforeEach(() => {
    popupDomContent.length = 0;
    sourceData = {};

    useMatchMedia.mockImplementation(() => true);

    map = createMapMock();
    map.queryRenderedFeatures.mockReturnValue([]);
    map.getSource.mockImplementation((id) => ({ setData: (data) => {
      sourceData[id] = data;
    } }));
  });

  test('keeps its drawing data out of the surrounding map drawing tools context', async () => {
    const setMapDrawingData = jest.fn();

    renderRuler(
      <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
        <MapRulerControl />
      </MapDrawingToolsContext.Provider>
    );

    await activate();

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
    expect(setMapDrawingData).not.toHaveBeenCalled();
  });

  describe('while measuring', () => {
    test('shows the area of the measured polygon in the cursor popup', async () => {
      renderRuler();

      await drawTriangle();

      await waitFor(() => {
        expect(findPopupWithText('Bearing:').pop()).toHaveTextContent('Area: 6181.86km²');
      });
    });

    test('shades the measured polygon on the map', async () => {
      renderRuler();

      await drawTriangle();

      await waitFor(() => {
        expect(sourceData[SOURCE_IDS.FILL_SOURCE].geometry.coordinates[0])
          .toEqual([[0, 0], [1, 0], [1, 1], [0, 0]]);
      });
    });

    test('gates the shading and the area readout together', async () => {
      renderRuler();

      await activate();
      await clickMapAt(0, 0);
      await clickMapAt(1, 0);

      await waitFor(() => {
        expect(sourceData[SOURCE_IDS.FILL_SOURCE].features).toHaveLength(0);
      });
      expect(findPopupWithText('Bearing:').pop()).not.toHaveTextContent('Area:');
    });
  });

  describe('once the measurement is finished', () => {
    const finishMeasurement = async () => {
      await drawTriangle();
      await clickMapAt(1, 1);

      await act(async () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });
    };

    beforeEach(() => {
      map.getLayer.mockImplementation((layerId) => Object.values(LAYER_IDS).includes(layerId) ? { id: layerId } : undefined);
    });

    test.each([
      ['shaded polygon', LAYER_IDS.FILL],
      ['drawn line', LAYER_IDS.LINES],
      ['drawn points', LAYER_IDS.POINTS],
    ])('keeps the measurement when the %s is clicked', async (_, layerId) => {
      renderRuler();

      await finishMeasurement();

      map.queryRenderedFeatures.mockImplementation((_point, { layers } = {}) =>
        layers?.includes(layerId) ? [{ layer: { id: layerId }, properties: {} }] : []);
      await clickMapAt(0.5, 0.2);

      expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
    });

    test('dismisses the measurement when the map is clicked away from it', async () => {
      renderRuler();

      await finishMeasurement();

      await clickMapAt(20, 20);

      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    });
  });
});
