import React, { memo, useContext, useMemo, useEffect } from 'react';
import { MapContext } from '../App';

import { TILE_LAYER_SOURCE_TYPES, MAX_ZOOM, MIN_ZOOM } from '../constants';

import { POLYGONS_LAYER_ID as BEFORE_LAYER_ID } from '../SpatialFeaturesLayer';

import { calculateSourceConfigurationFromLayer, calculateMapConfigurationFromLayer } from '../utils/layers';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

const RASTER_SOURCE_OPTIONS = {
  'type': 'raster',
  'tiles': [],
  'tileSize': 256,
};

const RenderFunction = ({ children }) => <>{children}</>;

const SourceComponent = ({ id, layer }) => {
  // useMemo keeps config referentially stable so useMapSources doesn't re-run on every render.
  const config = useMemo(() => ({
    ...RASTER_SOURCE_OPTIONS,
    tiles: [layer.attributes.url],
    ...calculateSourceConfigurationFromLayer(layer),
  }), [layer]);

  useMapSources([{ id }], config);

  return null;
};

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer } = props;

  const map = useContext(MapContext);

  const activeLayer = useMemo(() =>
    layers.find(({ id }) => id === currentBaseLayer?.id)
  , [currentBaseLayer?.id, layers]);

  // useMemo keeps mapConfig referentially stable so the useEffect below doesn't re-run on every render.
  const mapConfig = useMemo(() =>
    calculateMapConfigurationFromLayer(activeLayer ?? currentBaseLayer)
  , [activeLayer, currentBaseLayer]);

  useEffect(() => {
    if (!map) return;

    const assertZoomLimits = () => {
      map.setMaxZoom(mapConfig.maxzoom || MAX_ZOOM);
      map.setMinZoom(mapConfig.minzoom || MIN_ZOOM);
    };

    assertZoomLimits();
    // Re-assert after GL finishes async source processing, which can override
    // transform.maxZoom when a source has maxzoom set (e.g. from maxNativeZoom).
    map.once('idle', assertZoomLimits);

    return () => map.off('idle', assertZoomLimits);
  }, [map, mapConfig]);

  useMapLayers([{
    id: `tile-layer-${activeLayer?.id}`,
    type: 'raster',
    sourceId: `layer-source-${activeLayer?.id}`,
    options: {
      before: BEFORE_LAYER_ID,
      condition: !!activeLayer
    }
  }]);

  return layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer =>
      <RenderFunction key={layer.id}>
        <SourceComponent id={`layer-source-${layer.id}`} layer={layer} />
      </RenderFunction>
    );
};

export default memo(TileLayerRenderer);