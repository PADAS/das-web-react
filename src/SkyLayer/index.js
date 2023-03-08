import React, { useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';

import { getSunPosition, updateSunPosition } from '../utils/sky';
import { useMapEventBinding } from '../hooks';

const SUN_POSITION = [0, 0];
export const DEFAULT_SKY_LAYER_CONFIG = {
  'id': 'sky',
  'type': 'sky',
  'paint': {
    'sky-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0,
      0,
      5,
      0.3,
      8,
      1
    ],
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': SUN_POSITION,
    'sky-atmosphere-sun-intensity': 5
  }
};

const SkyLayer = (props) => {
  const { map } = props;

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const mapMoveHandler = useCallback(debounce(() => {
    if (map) {
      const newPosition = getSunPosition(map);
      updateSunPosition(map, newPosition);
    }
  }), [map]);

  useMapEventBinding('moveend', mapMoveHandler);

  useEffect(() => {

    if (!map.getLayer(DEFAULT_SKY_LAYER_CONFIG.id)) {
      map.addLayer(DEFAULT_SKY_LAYER_CONFIG);
    }

  }, [map]);

  return null;
};

export default SkyLayer;