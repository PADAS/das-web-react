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

  const layerToRender = layers.find(l => l.id === currentBaseLayer.id);

  const renderLayer = () => <Layer sourceId={layerToRender.id} type="raster" id={uuid()} />;

  const tileSources = layers
    .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
    .map(layer => <Source key={layer.id} id={layer.id} tileJsonSource={{
      ...RASTER_SOURCE_OPTIONS,
      tiles: [
        layer.attributes.url,
      ],
    }} >
    </Source>);

  return <Fragment>
    {tileSources}
    {layerToRender && renderLayer()}
  </Fragment>;

};

export default memo(TileLayerRenderer);