import React, { memo, Fragment, useEffect, useState } from 'react';
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

const ActiveTileLayer = memo((props) => { // eslint-disable-line
  const { layers, currentBaseLayer } = props;

  const [activeLayer, setActiveLayer] = useState(null);

  useEffect(() => {
    const match = layers.find(({ id }) => id === currentBaseLayer.id);
    setActiveLayer(match);
  }, [layers, currentBaseLayer]);

  return !!activeLayer && <Layer before={FEATURE_FILLS} id={`tile-layer-${activeLayer.id}`} key={activeLayer.id} sourceId={`layer-source-${activeLayer.id}`} type="raster" />;
});

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer } = props;
  return <Fragment>
    <TileSources layers={layers} />
    <ActiveTileLayer layers={layers} currentBaseLayer={currentBaseLayer} />
  </Fragment>;

};

export default memo(TileLayerRenderer);