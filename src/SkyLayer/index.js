import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
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

const virtualDateSelector = ({ view: { timeSliderState } }) => {
  const { active: timeSliderActive, virtualDate } = timeSliderState;
  return timeSliderActive && virtualDate;
};

const SkyLayer = (props) => {
  const { map } = props;
  const virtualDate = useSelector(virtualDateSelector);

  const setSunPosition = useMemo(() => debounce(() => {
    if (map) {
      const newPosition = getSunPosition(map, virtualDate);
      updateSunPosition(map, newPosition);
    }
  }), [map, virtualDate]);

  useEffect(setSunPosition, [setSunPosition]);
  useMapEventBinding('moveend', setSunPosition);

  useEffect(() => {

    if (!map.getLayer(DEFAULT_SKY_LAYER_CONFIG.id)) {
      map.addLayer(DEFAULT_SKY_LAYER_CONFIG);
    }

  }, [map]);

  return null;
};

export default SkyLayer;