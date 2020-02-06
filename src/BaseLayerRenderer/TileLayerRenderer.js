import React, { memo, Fragment } from 'react';
import { Layer, Source } from 'react-mapbox-gl';

import { TILE_LAYER_SOURCE_TYPES, LAYER_IDS } from '../constants';

const { FEATURE_FILLS } = LAYER_IDS;

const RASTER_SOURCE_OPTIONS = {
  'type': 'raster',
  'tiles': [],
  'tileSize': 256,
};

const TileSources = memo((props) => { // eslint-disable-line
  const { layers } = props;
  return <Fragment>
    {layers
      .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
      .map(layer => <Source key={layer.id} id={`layer-source-${layer.id}`} tileJsonSource={{
        ...RASTER_SOURCE_OPTIONS,
        tiles: [
          layer.attributes.url,
        ],
      }} >
      </Source>)}
  </Fragment>;
});

const TileLayers = memo((props) => { // eslint-disable-line
  const { layers, currentBaseLayer } = props;
  return <Fragment>
    {layers
      .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
      .map(layer => {
        const layout = {
          'visibility': layer.id === currentBaseLayer.id ? 'visible' : 'none',
        };
        return <Layer before={FEATURE_FILLS} id={`tile-layer-${layer.id}`} key={layer.id} layout={layout} sourceId={`layer-source-${layer.id}`} type="raster" />;
      })}
  </Fragment>;
});

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer } = props;
  return <Fragment>
    <TileSources layers={layers} />
    <TileLayers layers={layers} currentBaseLayer={currentBaseLayer} />
  </Fragment>;

};

export default memo(TileLayerRenderer);