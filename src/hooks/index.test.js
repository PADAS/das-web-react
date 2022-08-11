import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { MapContext } from '../App';

import { createMapMock } from '../__test-helpers/mocks';

import { useMemoCompare, useMapEventBinding, useMapLayer, useMapSource } from './';

describe('#useMapEventBinding', () => {
  let map, wrapper, handler;
  const layerId = 'test-layer-id';

  beforeEach(() => {
    map = createMapMock();
    handler = jest.fn();
    wrapper = ({ children }) => <MapContext.Provider value={map}>{children}</MapContext.Provider>; // eslint-disable-line react/display-name
  });

  /* eventType = 'click', handlerFn = noop, layerId = null, condition = true */
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
      condition = true;

      /* expect no calls */
      rerender();

      /* expect map.on called */
      condition = false;

      rerender();
      /* expect map.off called */
    });
  });
});

describe('#useMapSource', () => {
  test('adding a source to the map', () => {

  });

  describe('@param config', () => {

  });
});

/* layerId, type, sourceId, paint, layout, config */
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
    test('setting and changing paint props', () => {
      let paintObject = { value1: 'yellow', value2: 0.6 };

      const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', paintObject), { wrapper });
      Object.entries(paintObject).forEach(([key, value]) => {
        expect(map.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });

      expect(map.setPaintProperty);

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
        expect(map.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });

      expect(map.setPaintProperty);

      layoutObject = { whatever: true };

      rerender();

      Object.entries(layoutObject).forEach(([key, value]) => {
        expect(map.setPaintProperty).toHaveBeenCalledWith(layerId, key, value);
      });

    });

    test('returning the layer value', () => {
      const mockValue = { whatever: 'ok this works' };

      map.addLayer.mockReturnValue(mockValue);

      const { result } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id'), { wrapper });

      expect(result.current).toEqual(mockValue);
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

      test('.before sets and changes', () => {
        let before = null;

        const { rerender } = renderHook(() => useMapLayer(layerId, 'string', 'whatever-source-id', null, null, { before }), { wrapper });

        before = 'how';

        rerender();

        expect(map.moveLayer).toHaveBeenCalledWith(layerId, 'how');
      });

      test('.maxZoom sets and changes', () => {
        const { rerender } = renderHook(() => useMapLayer(), { wrapper });
      });

      test('.minZoom sets and changes', () => {
        const { rerender } = renderHook(() => useMapLayer(), { wrapper });
      });

      describe('.condition', () => {
        test('sets and changes', () => {
          let condition = true;

          const { rerender } = renderHook(() => useMapLayer(), { wrapper });

          condition = false;

          rerender();
        });

        test('adds and removes a layer when toggled', () => {
          const { rerender } = renderHook(() => useMapLayer(), { wrapper });
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