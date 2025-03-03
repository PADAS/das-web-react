import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { MapContext } from '../../App';

import useMapLayerBatch from './';

describe('hooks - useMapLayer', () => {
  const layerId = 'sourceId';
  const baseMap = {
    getSource: jest.fn(),
    getLayer: jest.fn(),
    addLayer: jest.fn(),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setFilter: jest.fn(),
    removeLayer: jest.fn(),
    moveLayer: jest.fn(),
    setLayerZoomRange: jest.fn(),
  };

  // eslint-disable-next-line react/display-name
  const wrapper = (map) => ({ children }) => <MapContext.Provider value={map}>
    {children}
  </MapContext.Provider>;

  const renderUserMapLayer = (layerConfig, map, defaultConfig) =>
    renderHook(
      () => useMapLayerBatch(layerConfig, defaultConfig),
      { wrapper: wrapper(map) }
    );

  test('adding a layer to the map', () => {
    const map = {
      ...baseMap,
      getSource: jest.fn(() => true)
    };
    renderUserMapLayer({
      id: layerId,
      type: 'string',
      sourceId: 'whatever-source-id'
    }, map);

    expect(map.addLayer).toHaveBeenCalled();
  });

  test('not adding a layer if no map is available', () => {
    renderUserMapLayer();
    expect(baseMap.addLayer).not.toHaveBeenCalled();
  });

  describe('when the layer is present', () => {
    beforeEach(() => {
      baseMap.getLayer.mockReturnValue({ whatever: 'ok' });
    });

    test('setting and changing paint props', () => {
      let config = {
        id: layerId,
        type: 'string',
        sourceId: 'whatever-source-id',
        paint: { value1: 'yellow', value2: 0.6 }
      };

      const { rerender } = renderUserMapLayer(config, baseMap);

      Object.entries(config.paint).forEach(([key, value]) => {
        expect(baseMap.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });

      const newConfig = {
        id: layerId,
        type: 'string',
        sourceId: 'whatever-source-id',
        paint: {
          whatever: true
        }
      };

      rerender(newConfig);

      Object.entries(config.paint).forEach(([key, value]) => {
        expect(baseMap.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });
    });

  });
});
