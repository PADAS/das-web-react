import React, { memo, useContext, useMemo, useEffect } from 'react';
import { MapContext } from '../App';

import { TILE_LAYER_SOURCE_TYPES, LAYER_IDS, MAX_ZOOM, MIN_ZOOM } from '../constants';
import { useMapLayer, useMapSource } from '../hooks';

import { calcConfigForMapAndSourceFromLayer } from '../utils/layers';

const { FEATURE_FILLS } = LAYER_IDS;

const RASTER_SOURCE_OPTIONS = {
  'type': 'raster',
  'tiles': [],
  'tileSize': 256,
};

const RenderFunction = ({ children }) => <>{children}</>;

const SourceComponent = ({ id, tileUrl, sourceConfig }) => {
  const config = useMemo(() => ({
    ...RASTER_SOURCE_OPTIONS,
    tiles: [
      tileUrl,
    ],
    ...sourceConfig,
  }), [sourceConfig, tileUrl]);

  useMapSource(id, null, config);

  return null;
};

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer } = props;

  const map = useContext(MapContext);

  const activeLayer = useMemo(() =>
    layers.find(({ id }) => id === currentBaseLayer?.id)
  , [currentBaseLayer?.id, layers]);

  const { mapConfig, sourceConfig } = useMemo(() =>
    calcConfigForMapAndSourceFromLayer(currentBaseLayer)
  , [currentBaseLayer]);

  useEffect(() => {
    if (map) {
      map.setMaxZoom(mapConfig.maxzoom || MAX_ZOOM);
      map.setMinZoom(mapConfig.minzoom || MIN_ZOOM);
    }
  }, [map, mapConfig]);

  useMapLayer(
    'tile-layer',
    'raster',
    `layer-source-${activeLayer?.id}`,
    undefined,
    undefined,
    { before: FEATURE_FILLS, condition: !!activeLayer }
  );

  return layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer =>
      <RenderFunction key={layer.id}>
        <SourceComponent id={`layer-source-${layer.id}`} sourceConfig={sourceConfig} tileUrl={layer.attributes.url} />
      </RenderFunction>
    );
};

export default memo(TileLayerRenderer);