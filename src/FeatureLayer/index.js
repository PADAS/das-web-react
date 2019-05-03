import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

import { GENERATED_LAYER_IDS, LAYER_IDS, DEFAULT_SYMBOL_LAYOUT } from '../constants';

const { FEATURE_FILLS, FEATURE_LINES, FEATURE_SYMBOLS } = LAYER_IDS;
const { SUBJECT_SYMBOLS } = GENERATED_LAYER_IDS;

const linePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-opacity': [
    'case',
    ['has', 'stroke-opacity'], ['get', 'stroke-opacity'],
    1,
  ],
  'line-width': [
    'case',
    ['has', 'stroke-width'], ['get', 'stroke-width'],
    1,
  ],
};

const fillLayout = {
  'visibility': 'visible',
};

const fillPaint = {
  'fill-color': [
    'case',
    ['has', 'fill'], ['get', 'fill'],
    'blue',
  ],
  'fill-opacity': [
    'case',
    ['has', 'fill-opacity'], ['get', 'fill-opacity'],
    0,
  ],
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const FeatureLayer = memo(({ symbols, lines, polygons }) => {
  console.log('re rendering the feature layer', symbols, lines, polygons);
  return <Fragment>
    <GeoJSONLayer id={FEATURE_FILLS} before={SUBJECT_SYMBOLS} data={polygons}
      fillPaint={fillPaint}
      fillLayout={fillLayout}
    />
    <GeoJSONLayer id={FEATURE_LINES} before={SUBJECT_SYMBOLS} data={lines}
      lineLayout={lineLayout}
      linePaint={linePaint}
    />
    <GeoJSONLayer id={FEATURE_SYMBOLS} before={SUBJECT_SYMBOLS} data={symbols}
      symbolLayout={DEFAULT_SYMBOL_LAYOUT}
    />
  </Fragment>
});

FeatureLayer.propTypes = {
  symbols: PropTypes.object.isRequired,
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default FeatureLayer;