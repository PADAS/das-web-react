import React, { memo, Fragment } from 'react';
import { uuid } from '../utils/string';
import { Layer, Source } from 'react-mapbox-gl';

import { TILE_LAYER_SOURCE_TYPES } from '../constants';

const RASTER_SOURCE_OPTIONS = {
  'type': 'raster',
  'tiles': [],
  'tileSize': 256,
};

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer } = props;
  const currentTileLayer = layers.find(l => l.id === currentBaseLayer.id);

  const paint = {
    transition: {
      duration: 0,
    },
  };

  const tileSources = layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer => <Source key={layer.id} id={`layer-source-${layer.id}`} tileJsonSource={{
      ...RASTER_SOURCE_OPTIONS,
      tiles: [
        layer.attributes.url,
      ],
    }} >
    </Source>);

  const tileLayers = layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer => {
      const layout = {
        'visibility': layer.id === currentBaseLayer.id ? 'visible' : 'none',
      };
      return <Layer key={layer.id} layout={layout} sourceId={`layer-source-${layer.id}`} type="raster" />;
    });

  return <Fragment>
    {tileSources}
    {tileLayers}
  </Fragment>;

};

export default memo(TileLayerRenderer);