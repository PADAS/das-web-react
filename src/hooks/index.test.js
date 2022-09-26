import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { point } from '@turf/helpers';

import { MapContext } from '../App';

import { createMapMock } from '../__test-helpers/mocks';

import { useMemoCompare, useMapEventBinding, useMapLayer, useMapSource } from './';
import { waitFor } from '@testing-library/dom';

describe('#useMapEventBinding', () => {
  let map, wrapper, handler;
  const layerId = 'test-layer-id';

  beforeEach(() => {
    map = createMapMock();
    handler = jest.fn();
    wrapper = ({ children }) => <MapContext.Provider value={map}>{children}</MapContext.Provider>; // eslint-disable-line react/display-name
  });

  test('binding a handler function', () => {
    renderHook(() => useMapEventBinding('click', handler, layerId), { wrapper });
  });

  test('not binding if no map is available', () => {
    renderHook(() => useMapEventBinding('banana', handler, layerId)); // no context wrapper means there's no map available;
  });

  describe('@param condition', () => {
    test('binding and unbinding based on the "condition" argument', () => {
      let condition = false;
      const { rerender } = renderHook(() => useMapEventBinding('fakebindingname', handler, layerId, condition), { wrapper });

      expect(map.on).not.toHaveBeenCalled();

      condition = true;

      rerender();

      expect(map.on).toHaveBeenCalledWith('fakebindingname', layerId, handler);

      condition = false;

      rerender();

      expect(map.off).toHaveBeenCalledWith('fakebindingname', layerId, handler);
    });
  });
});

describe('#useMapSource', () => {
  let map, data, wrapper;
  const sourceId = 'source-id-ok';

  beforeEach(() => {
    map = createMapMock();
    data = point([-1, -4]);
    wrapper = ({ children }) => <MapContext.Provider value={map}>{children}</MapContext.Provider>; /* eslint-disable-line react/display-name */
  });

  test('adding a source to the map', async () => {
    map.getSource.mockReturnValue(null);
    renderHook(() => useMapSource(sourceId, data), { wrapper });

    await waitFor(() => {
      expect(map.addSource).toHaveBeenCalledWith(sourceId, {
        type: 'geojson',
        data,
      });
    });
  });

  test('@param config adds configuration to the source creation options', async () => {
    const mockConfig = { type: 'bananas', hello: true };

    map.getSource.mockReturnValue(null);

    renderHook(() => useMapSource(sourceId, data, mockConfig), { wrapper });

    await waitFor(() => {
      expect(map.addSource).toHaveBeenCalledWith(sourceId, {
        ...mockConfig,
        data,
      });
    });
  });
});

describe('#useMapLayer', () => {
  let wrapper, map;

  const layerId = 'test-layer-id';

  beforeEach(() => {
    map = createMapMock();
    wrapper = ({ children }) => <MapContext.Provider value={map}>{children}</MapContext.Provider>; // eslint-disable-line react/display-name
  });

  test('adding a layer to the map', () => {
    renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id'), { wrapper });

    expect(map.addLayer).toHaveBeenCalled();
  });

  test('not adding a layer if no map is available', () => {
    renderHook(() => useMapLayer()); // no context wrapper means there's no map available;

    expect(map.addLayer).not.toHaveBeenCalled();
  });

  describe('when the layer is present', () => {
    beforeEach(() => {
      map.getLayer.mockReturnValue({ whatever: 'ok' });
    });
    test('setting and changing paint props', () => {
      let paintObject = { value1: 'yellow', value2: 0.6 };

      const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', paintObject), { wrapper });
      Object.entries(paintObject).forEach(([key, value]) => {
        expect(map.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });

      paintObject = { whatever: true };


      rerender();

      Object.entries(paintObject).forEach(([key, value]) => {
        expect(map.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });

    });

    test('setting and changing layout props', () => {
      let layoutObject = { value1: 'yellow', value2: 0.6 };

      const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', null, layoutObject), { wrapper });
      Object.entries(layoutObject).forEach(([key, value]) => {
        expect(map.setLayoutProperty).toHaveBeenCalledWith(layerId, key, value);
      });

      layoutObject = { whatever: true };

      rerender();

      Object.entries(layoutObject).forEach(([key, value]) => {
        expect(map.setLayoutProperty).toHaveBeenCalledWith(layerId, key, value);
      });

    });

    test('returning the layer value', () => {

      const { result } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id'), { wrapper });

      expect(result.current).toEqual({ whatever: 'ok' });
    });

    test('removing a layer on unmount', () => {
      const { unmount } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id'), { wrapper });

      unmount();

      expect(map.removeLayer).toHaveBeenCalledWith(layerId);
    });

    describe('@param config', () => {
      test('.filter sets and changes', () => {
        let filter = ['==', [['get', 'subject_subtype'], 'ranger']];

        const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', null, null, { filter }), { wrapper });
        expect(map.setFilter).toHaveBeenCalledWith(layerId, filter);

        filter = 'oh whatever dude';

        rerender();

        expect(map.setFilter).toHaveBeenCalledWith(layerId, 'oh whatever dude');

      });

      test('.before sets and changes', async () => {
        let before = null;

        const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', null, null, { before }), { wrapper });

        expect(map.moveLayer).not.toHaveBeenCalled();

        before = 'how';

        rerender();

        await waitFor(() => {
          expect(map.moveLayer).toHaveBeenCalledWith(layerId, 'how');
        });
      });

      test('zoom config sets and changes', () => {
        const config = {
          maxZoom: 15,
          minZoom: 1
        };

        const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', null, null, config), { wrapper });

        expect(map.setLayerZoomRange).toHaveBeenCalledWith(layerId, 1, 15);

        config.maxZoom = 20;

        rerender();

        expect(map.setLayerZoomRange).toHaveBeenCalledWith(layerId, 1, 20);

        config.minZoom = 7;

        rerender();

        expect(map.setLayerZoomRange).toHaveBeenCalledWith(layerId, 7, 20);

      });

      describe('.condition', () => {
        test('adds and removes a layer when toggled', async () => {
          map.getLayer.mockReturnValue(undefined);

          const config = { condition: false };

          const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', null, null, config), { wrapper });

          expect(map.addLayer).not.toHaveBeenCalled();

          config.condition = true;

          rerender();

          await waitFor(() => {
            expect(map.removeLayer).not.toHaveBeenCalled();
            expect(map.addLayer).toHaveBeenCalled();
          });

          map.getLayer.mockReturnValue({ whatever: 'ok' });
          config.condition = false;

          rerender();
          await waitFor(() => {
            expect(map.removeLayer).toHaveBeenCalled();
          });
        });

      });
    });
  });

});

describe('#useMemoCompare', () => {
  test('returning the first value on first render', () => {
    let value = { whatever: 123 };

    const { result } = renderHook(() => useMemoCompare(value));

    expect(result.current).toEqual(value);
  });

  test('returning a reference to the first value if an updated value is identical', () => {
    let value = { whatever: 123 };

    const { result, rerender } = renderHook(() => useMemoCompare(value));

    rerender({ whatever: 123 }); // pass a new object with identical props

    expect(result.current).toEqual(value); // the reference is intact
  });

  test('returning a reference to the new value if it is updated', () => {
    let value = { whatever: 123 };

    const { result, rerender } = renderHook(() => useMemoCompare(value));

    value = { hello: false };

    rerender();

    expect(result.current).toEqual({ hello: false }); // the reference is intact

  });
});