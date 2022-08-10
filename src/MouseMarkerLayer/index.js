import React, { memo, useMemo } from 'react';
import { point } from '@turf/helpers';

import { SYMBOL_ICON_SIZE_EXPRESSION } from '../constants';
import { useMapLayer, useMapSource } from '../hooks';

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


  useMapSource('mouse-marker-source', cursorPoint);
  useMapLayer('mouse-marker-layer', 'symbol', 'mouse-marker-source', null, layout);

  return null;
};

export default memo(MouseMarkerLayer);