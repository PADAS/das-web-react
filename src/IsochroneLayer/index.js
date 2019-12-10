import React, { memo, Fragment, useEffect, useState } from 'react';
import { Source, Layer } from 'react-mapbox-gl';
import getIsochrone from 'mb-isochrone';
import area from '@turf/area';
import isEqual from 'react-fast-compare';

import { LAYER_IDS, REACT_APP_MAPBOX_TOKEN } from '../constants';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const linePaint = {
  'line-color': {
    'property': 'time',
    'type': 'interval',
    'stops': [
      [
        -150,
        '#f54e5e'
      ],
      [
        600,
        '#f9886c'
      ],
      [
        1200,
        '#f1f075'
      ],
      [
        1800,
        '#56b881'
      ],
      [
        2400,
        '#3887be'
      ],
      [
        3150,
        '#4a4a8b'
      ]
    ]
  },
  'line-opacity': 0.25,
  'line-width': {
    'base': 1.5,
    'stops': [
      [
        10,
        1
      ],
      [
        22,
        3
      ]
    ]
  }
};

const linePaintMajor = {
  'line-color': {
    'property': 'time',
    'type': 'interval',
    'stops': [
      [
        150,
        '#f54e5e'
      ],
      [
        900,
        '#f9886c'
      ],
      [
        1500,
        '#f1f075'
      ],
      [
        2100,
        '#56b881'
      ],
      [
        2700,
        '#3887be'
      ],
      [
        3450,
        '#4a4a8b'
      ]
    ]
  },
  'line-width': {
    'base': 1,
    'stops': [
      [
        10,
        1.5
      ],
      [
        22,
        15
      ]
    ]
  }
};

const labelLayout = {
  'text-field': '{minutes} MIN',
  'text-font': [
    'DIN Offc Pro Bold'
  ],
  'symbol-placement': 'line',
  'text-allow-overlap': true,
  'text-padding': 1,
  'text-max-angle': 90,
  'text-size': {
    'base': 1.2,
    'stops': [
      [
        8,
        12
      ],
      [
        22,
        30
      ]
    ]
  },
  'text-letter-spacing': 0.1
};

const labelPaint = {
  'text-halo-color': 'white',
  'text-color': {
    'property': 'time',
    'type': 'interval',
    'stops': [
      [
        150,
        '#f54e5e'
      ],
      [
        900,
        '#f9886c'
      ],
      [
        1500,
        '#f1f075'
      ],
      [
        2100,
        '#56b881'
      ],
      [
        2700,
        '#3887be'
      ],
      [
        3450,
        '#4a4a8b'
      ]
    ]
  },
  'text-halo-width': 6,
};

const IsochroneLayer = ({ coords }) => {

  const [isochrone, setIsochrone] = useState(null);


  useEffect(() => {
    if (coords) {
      getIsochrone(coords, { token: REACT_APP_MAPBOX_TOKEN, threshold: 3600, mode: 'walking' }, function (err, output) {
        const data = {
          ...output,
          features: output.features.map((feature) => {
            const seconds = feature.properties.time;

            return {
              ...feature,
              properties: {
                ...feature.properties,
                minutes: seconds / 60,
                quantized: seconds % 600 === 0 ? 3600 : (seconds % 300 === 0 ? 1800 : (seconds % 300 === 0 ? 900 : 1)),
                area: area(feature),
              },
            };
          })
        };
        if (err) throw err;
        setIsochrone({
          type: 'geojson',
          data,
        });
      });
    }
  }, [coords]);

  if (!coords) return null;

  return isochrone && <Fragment>
    <Source id='isochrone-data' geoJsonSource={isochrone} />
    <Layer type='line' before={SUBJECT_SYMBOLS} sourceId='isochrone-data' paint={linePaint} id='isochrone-lines' />
    <Layer filter={[
      '>=',
      'quantized',
      3600
    ]} type='line' before={SUBJECT_SYMBOLS} sourceId='isochrone-data' paint={linePaintMajor} id='isochrone-major-lines' />
    <Layer filter={[
      '>=',
      'quantized',
      3600
    ]} type='symbol' before={SUBJECT_SYMBOLS} sourceId='isochrone-data' paint={labelPaint} layout={labelLayout} id='isochrone-labels' />
  </Fragment>;
};

export default memo(IsochroneLayer, (prev, current) => isEqual(prev.coords, current.coords));