import React, { useEffect, useMemo } from 'react'; /* eslint-disable-line no-unused-vars */

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

  useEffect(() => {

    if (!map.getLayer(DEFAULT_SKY_LAYER_CONFIG.id)) {
      map.addLayer(DEFAULT_SKY_LAYER_CONFIG);
    }
    
  }, [map]);

  return null;
};

export default SkyLayer;