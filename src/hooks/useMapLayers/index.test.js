import React from 'react';
import { waitFor } from '@testing-library/react';

import { renderHook } from '../../test-utils';
import { createMapMock } from '../../__test-helpers/mocks';
import { MapContext } from '../../App';
import useMapLayers from './';

describe('hooks - useMapLayers', () => {
  let wrapper, map;

  const layerId = 'test-layer-id';

  beforeEach(() => {
    map = createMapMock({
      getSource: jest.fn(() => true),
    });

    wrapper = ({ children }) => <MapContext.Provider value={map}>{children}</MapContext.Provider>;
  });

  test('adding a layer to the map', () => {
    renderHook(() => useMapLayers([{ id: layerId, type: 'string', sourceId: 'whatever-source-id' }]), { wrapper });

    expect(map.addLayer).toHaveBeenCalled();
  });

  test('not adding a layer if no map is available', () => {
    renderHook(() => useMapLayers()); // no context wrapper means there's no map available;

    expect(map.addLayer).not.toHaveBeenCalled();
  });

  describe('when the layer is present', () => {
    beforeEach(() => {
      map.getLayer.mockReturnValue({ whatever: 'ok' });
    });
    test('setting and changing paint props', () => {
      let paintObject = { value1: 'yellow', value2: 0.6 };

      const { rerender } = renderHook(() => useMapLayers([{
        id: layerId,
        type: 'string',
        sourceId: 'whatever-source-id',
        paint: paintObject
      }]), { wrapper });

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

      const { rerender } = renderHook(() => useMapLayers([{
        id: layerId,
        type: 'string',
        sourceId: 'whatever-source-id',
        layout: layoutObject
      }]), { wrapper });

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

      const { result } = renderHook(() => useMapLayers([{
        id: layerId,
        type: 'string',
        sourceId: 'whatever-source-id',
      }]), { wrapper });

      expect(result.current).toEqual([{ whatever: 'ok' }]);
    });

    describe('@param config', () => {
      test('.filter sets and changes', () => {
        let filter = ['==', [['get', 'subject_subtype'], 'ranger']];

        const { rerender } = renderHook(() => useMapLayers([{
          id: layerId,
          type: 'string',
          sourceId: 'whatever-source-id',
          options: { filter }
        }]), { wrapper });

        expect(map.setFilter).toHaveBeenCalledWith(layerId, filter);

        filter = ['oh whatever dude'];

        rerender();

        expect(map.setFilter).toHaveBeenCalledWith(layerId, ['oh whatever dude']);

      });

      describe('.condition', () => {
        test('adds and removes a layer when toggled', async () => {
          map.getLayer.mockReturnValue(undefined);

          const config = { condition: false };

          const { rerender } = renderHook(() => useMapLayers([{
            id: layerId,
            type: 'string',
            sourceId: 'whatever-source-id',
            options: config
          }]), { wrapper });

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
