import React, { useEffect } from 'react';
import { point } from '@turf/helpers';



import PopoverBackgroundImg from '../common/images/icons/semi-transparent-black-popover-bg.png';

const POPOVER_IMG_ID = 'static_sensor_closed_popover_background';
const SOURCE_ID = 'static-sensors-source';
const LAYER_ID = 'static-sensors-layer';

const layout = {
  'icon-allow-overlap': true,
  'icon-image': POPOVER_IMG_ID,
  'icon-text-fit': 'both',
  'icon-anchor': 'bottom',
  'text-field': 'howdy doody what an interesting idea and funky way to handle something so cool',
  'text-allow-overlap': true,
};

const paint = {
  'text-color': 'white',
};

const sourceData = {
  type: 'geojson',
  data: point([-122.3875, 47.5872]),
};


const StaticSensorLayer = (props) => {
  const { map } = props;

  useEffect(() => {
    if (map) {
      if (!map.hasImage(POPOVER_IMG_ID)) {
        map.loadImage(PopoverBackgroundImg, (_err, img) => {
          map.addImage(POPOVER_IMG_ID, img, {
            // The two (blue) columns of pixels that can be stretched horizontally:
            //   - the pixels between x: 25 and x: 55 can be stretched
            //   - the pixels between x: 85 and x: 115 can be stretched.
            stretchX: [
              [32, 44],
              [112, 124]
            ],
            // The one (red) row of pixels that can be stretched vertically:
            //   - the pixels between y: 25 and y: 100 can be stretched
            stretchY: [[26, 50]],
            // This part of the image that can contain text ([x1, y1, x2, y2]):
            content: [32, 26, 124, 50],
            // This is a high-dpi image:
            // pixelRatio: 2
          });
        });
      }

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, sourceData);
      }

      if (!map.getLayer(LAYER_ID)) {

        map.addLayer({
          id: LAYER_ID,
          source: SOURCE_ID,
          type: 'symbol',
          layout,
          paint,
        });
      }
    }

  }, [map]);

  return null;
};

export default StaticSensorLayer;