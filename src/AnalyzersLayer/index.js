import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

import { GENERATED_LAYER_IDS, LAYER_IDS, DEFAULT_SYMBOL_LAYOUT } from '../constants';

const { ANALYZER_POLYS, ANALYZER_LINES, ANALYZER_SYMBOLS } = LAYER_IDS;
const { SUBJECT_SYMBOLS } = GENERATED_LAYER_IDS;

// TODO - see if this makes sense
const ACTIVE_FEATURE_STATE = 'active';
const IF_ACTIVE = (activeProp) =>  [['boolean', ['feature-state', ACTIVE_FEATURE_STATE], false], activeProp];

const IF_HAS_PROPERTY = (prop, defaultValue) => {
  return [['has', prop], ['get', prop], defaultValue];
};

const linePaint = {
  'line-color': [
    'case',
    ...IF_ACTIVE('red'),
    ...IF_HAS_PROPERTY('stroke', 'orange'),
  ],
  'line-opacity': [
    'case',
    ...IF_HAS_PROPERTY('stroke-opacity', 1),
  ],
  'line-width': [
    'case',
    ...IF_ACTIVE(3),
    ...IF_HAS_PROPERTY('stroke-width', 1),
  ],
};

const fillLayout = {
  'visibility': 'visible',
};

const fillPaint = {
  'fill-color': [
    'case',
    ...IF_ACTIVE('blue'),
    ...IF_HAS_PROPERTY('fill', 'orange'),
  ],
  'fill-opacity': [
    'case',
    ...IF_HAS_PROPERTY('fill-opacity', 0),
  ],
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
};

const AnalyzerLayer = memo(({ symbols, lines, polygons }) => {
  return <Fragment>
    <GeoJSONLayer id={ANALYZER_POLYS} before={SUBJECT_SYMBOLS} data={polygons}
      fillPaint={fillPaint}
      fillLayout={fillLayout}
    />
    <GeoJSONLayer id={ANALYZER_LINES} before={SUBJECT_SYMBOLS} data={lines}
      lineLayout={lineLayout}
      linePaint={linePaint}
    />
    <GeoJSONLayer id={ANALYZER_SYMBOLS} before={SUBJECT_SYMBOLS} data={symbols}
      symbolLayout={symbolLayout}
    />
  </Fragment>
});

AnalyzerLayer.propTypes = {
  symbols: PropTypes.object.isRequired,
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default AnalyzerLayer;