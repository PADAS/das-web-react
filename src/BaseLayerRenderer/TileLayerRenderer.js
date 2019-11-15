import React, { memo, Fragment } from 'react';
import { Layer, Source } from 'react-mapbox-gl';
import { withMap } from '../EarthRangerMap';

import { TILE_LAYER_SOURCE_TYPES, LAYER_IDS } from '../constants';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const RASTER_SOURCE_OPTIONS = {
  'type': 'raster',
  'tiles': [],
  'tileSize': 256,
};

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer, map } = props;

  const tileSources = layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer => <Source key={layer.id} id={`layer-source-${layer.id}`} tileJsonSource={{
      ...RASTER_SOURCE_OPTIONS,
      tiles: [
        layer.attributes.url,
      ],
    }} >
    </Source>);

    const defaultBeforeLayer = map.getLayer(SUBJECT_SYMBOLS) ? SUBJECT_SYMBOLS : null;

  const tileLayers = layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer => {
      const layout = {
        'visibility': layer.id === currentBaseLayer.id ? 'visible' : 'none',
      };
      return <Layer before={defaultBeforeLayer} id={`tile-layer-${layer.id}`} key={layer.id} layout={layout} sourceId={`layer-source-${layer.id}`} type="raster" />;
    });

  return <Fragment>
    {tileSources}
    {tileLayers}
  </Fragment>;

};

export default memo(withMap(TileLayerRenderer));