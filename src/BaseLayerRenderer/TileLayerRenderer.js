import React, { memo, Fragment, useMemo } from 'react';
import { Layer, Source } from 'react-mapbox-gl';

import { TILE_LAYER_SOURCE_TYPES, LAYER_IDS } from '../constants';

import { calcZoomForSourceConfig } from '../utils/layers';

const { FEATURE_FILLS } = LAYER_IDS;

const RASTER_SOURCE_OPTIONS = {
  'type': 'raster',
  'tiles': [],
  'tileSize': 256,
};

const TileLayerRenderer = (props) => {
  const { layers, currentBaseLayer } = props;

  const activeLayer = layers.find(({ id }) => id === currentBaseLayer.id);

  const zoomConfig = useMemo(() => calcZoomForSourceConfig(currentBaseLayer), [currentBaseLayer]);

  return <Fragment>
    {layers
      .filter(layer => TILE_LAYER_SOURCE_TYPES.includes(layer.attributes.type))
      .map(layer => <Source key={layer.id} id={`layer-source-${layer.id}`} tileJsonSource={{
        ...RASTER_SOURCE_OPTIONS,
        tiles: [
          layer.attributes.url,
        ],
        ...zoomConfig,
      }} >
      </Source>)}

    {!!activeLayer && <Layer before={FEATURE_FILLS} id={`tile-layer-${activeLayer.id}`} key={activeLayer.id} sourceId={`layer-source-${activeLayer.id}`} type="raster" />}
  </Fragment>;

};

export default memo(TileLayerRenderer);