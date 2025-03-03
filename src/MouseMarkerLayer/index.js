import React, { memo, useMemo } from 'react';
import { point } from '@turf/turf';

import { SYMBOL_ICON_SIZE_EXPRESSION, LAYER_IDS, SOURCE_IDS } from '../constants';
import useMapSource from '../hooks/useMapSource';
import useMapLayer from '../hooks/useMapLayer';

const { MOUSE_MARKER_SOURCE } = SOURCE_IDS;
const { MOUSE_MARKER_LAYER } = LAYER_IDS;

const layout = {
  'icon-image': 'marker-icon',
  'icon-size': SYMBOL_ICON_SIZE_EXPRESSION,
  'icon-allow-overlap': true,
  'icon-anchor': 'bottom',
};

const MouseMarkerLayer = ({ location }) => {

  const cursorPoint = useMemo(() => location?.lng ?
    point([location.lng, location.lat])
    : null
  , [location.lat, location.lng]);


  useMapSource({ id: MOUSE_MARKER_SOURCE, data: cursorPoint });
  useMapLayer({
    id: MOUSE_MARKER_LAYER,
    type: 'symbol',
    sourceId: MOUSE_MARKER_SOURCE,
    layout
  });

  return null;
};

export default memo(MouseMarkerLayer);