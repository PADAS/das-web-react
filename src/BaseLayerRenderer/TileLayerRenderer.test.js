import React from 'react';

import { render } from '../test-utils';
import { MapContext } from '../MapContext';
import { createMapMock } from '../__test-helpers/mocks';
import {
  withMaxMinAndMaxNativeZoom,
  withMaxZoom,
  withMinZoom,
  withNoZoomConfig,
} from '../__test-helpers/fixtures/layers';
import { MAX_ZOOM, MIN_ZOOM } from '../constants';

import TileLayerRenderer from './TileLayerRenderer';

describe('TileLayerRenderer', () => {
  let map;

  beforeEach(() => {
    map = createMapMock();
  });

  const renderComponent = (props) => render(
    <MapContext.Provider value={map}>
      <TileLayerRenderer {...props} />
    </MapContext.Provider>
  );

  describe('interactive zoom limits', () => {
    test('sets maxZoom from layer configuration', () => {
      renderComponent({ layers: [withMaxZoom], currentBaseLayer: withMaxZoom });

      expect(map.setMaxZoom).toHaveBeenCalledWith(19);
    });

    test('maxNativeZoom does not affect the interactive zoom limit', () => {
      // withMaxMinAndMaxNativeZoom has maxZoom: 19 and maxNativeZoom: 17
      renderComponent({ layers: [withMaxMinAndMaxNativeZoom], currentBaseLayer: withMaxMinAndMaxNativeZoom });

      expect(map.setMaxZoom).toHaveBeenCalledWith(19);
      expect(map.setMaxZoom).not.toHaveBeenCalledWith(17);
    });

    test('falls back to MAX_ZOOM when no maxZoom is configured', () => {
      renderComponent({ layers: [withNoZoomConfig], currentBaseLayer: withNoZoomConfig });

      expect(map.setMaxZoom).toHaveBeenCalledWith(MAX_ZOOM);
    });

    test('sets minZoom from layer configuration', () => {
      // withMinZoom has minZoom: 19
      renderComponent({ layers: [withMinZoom], currentBaseLayer: withMinZoom });

      expect(map.setMinZoom).toHaveBeenCalledWith(19);
    });

    test('falls back to MIN_ZOOM when no minZoom is configured', () => {
      renderComponent({ layers: [withMaxZoom], currentBaseLayer: withMaxZoom });

      expect(map.setMinZoom).toHaveBeenCalledWith(MIN_ZOOM);
    });

    test('registers an idle listener to re-assert zoom limits after async source processing', () => {
      renderComponent({ layers: [withMaxZoom], currentBaseLayer: withMaxZoom });

      expect(map.once).toHaveBeenCalledWith('idle', expect.any(Function));
    });

    test('removes the idle listener on unmount', () => {
      const { unmount } = renderComponent({ layers: [withMaxZoom], currentBaseLayer: withMaxZoom });

      unmount();

      expect(map.off).toHaveBeenCalledWith('idle', expect.any(Function));
    });
  });

  describe('zoom config source precedence', () => {
    test('uses fresh activeLayer from layers over stale persisted currentBaseLayer', () => {
      const staleCurrentBaseLayer = {
        ...withMaxZoom,
        attributes: { ...withMaxZoom.attributes, configuration: { maxZoom: 5 } },
      };

      renderComponent({
        layers: [withMaxZoom],              // fresh from API: maxZoom 19
        currentBaseLayer: staleCurrentBaseLayer, // stale persisted: maxZoom 5
      });

      expect(map.setMaxZoom).toHaveBeenCalledWith(19);
      expect(map.setMaxZoom).not.toHaveBeenCalledWith(5);
    });

    test('falls back to currentBaseLayer zoom config when no matching layer is in layers', () => {
      // currentBaseLayer (withMaxZoom) is not in the layers list, so activeLayer is undefined
      renderComponent({
        layers: [withMinZoom],
        currentBaseLayer: withMaxZoom, // maxZoom: 19, used as fallback
      });

      expect(map.setMaxZoom).toHaveBeenCalledWith(19);
    });
  });

  describe('per-layer raster source configuration', () => {
    beforeEach(() => {
      map.getSource.mockReturnValue(undefined);
    });

    test('maps maxNativeZoom to source maxzoom to control tile fetching', () => {
      // withMaxMinAndMaxNativeZoom has maxNativeZoom: 17 — tiles above zoom 17 are re-used
      renderComponent({ layers: [withMaxMinAndMaxNativeZoom], currentBaseLayer: withMaxMinAndMaxNativeZoom });

      expect(map.addSource).toHaveBeenCalledWith(
        `layer-source-${withMaxMinAndMaxNativeZoom.id}`,
        expect.objectContaining({ maxzoom: 17 })
      );
    });

    test('does not set source maxzoom when maxNativeZoom is absent', () => {
      renderComponent({ layers: [withMaxZoom], currentBaseLayer: withMaxZoom });

      const call = map.addSource.mock.calls.find(([id]) => id === `layer-source-${withMaxZoom.id}`);
      expect(call).toBeDefined();
      expect(call[1]).not.toHaveProperty('maxzoom');
    });

    test('creates a separate source for each tile layer', () => {
      renderComponent({
        layers: [withMaxMinAndMaxNativeZoom, withMaxZoom],
        currentBaseLayer: withMaxMinAndMaxNativeZoom,
      });

      expect(map.addSource).toHaveBeenCalledWith(`layer-source-${withMaxMinAndMaxNativeZoom.id}`, expect.anything());
      expect(map.addSource).toHaveBeenCalledWith(`layer-source-${withMaxZoom.id}`, expect.anything());
    });

    test('includes the layer tile URL in the source tiles array', () => {
      renderComponent({ layers: [withMaxZoom], currentBaseLayer: withMaxZoom });

      expect(map.addSource).toHaveBeenCalledWith(
        `layer-source-${withMaxZoom.id}`,
        expect.objectContaining({ tiles: [withMaxZoom.attributes.url] })
      );
    });
  });
});
