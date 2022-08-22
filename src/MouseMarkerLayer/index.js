import React, { memo, useMemo } from 'react';
import { point } from '@turf/helpers';

import { SYMBOL_ICON_SIZE_EXPRESSION, LAYER_IDS, SOURCE_IDS } from '../constants';
import { useMapLayer, useMapSource } from '../hooks';

const { MOUSE_MARKER_SOURCE } = SOURCE_IDS;
const { MOUSE_MARKER_LAYER } = LAYER_IDS;

const layout = {
  'icon-image': 'marker-icon',
  'icon-size': SYMBOL_ICON_SIZE_EXPRESSION,
  'icon-allow-overlap': true,
  'icon-anchor': 'bottom',
};

// eslint-disable-next-line no-unused-vars
const MouseMarkerLayer = ({ map, location, ...rest }) => {

  const cursorPoint = useMemo(() => location?.lng ?
    point([location.lng, location.lat])
    : null
  , [location.lat, location.lng]);


  useMapSource(MOUSE_MARKER_SOURCE, cursorPoint);
  useMapLayer(MOUSE_MARKER_LAYER, 'symbol', MOUSE_MARKER_SOURCE, null, layout);

  return null;
};

export default memo(MouseMarkerLayer);