import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const { FEATURE_FILLS, FEATURE_LINES, FEATURE_SYMBOLS, SUBJECT_SYMBOLS } = LAYER_IDS;

const ACTIVE_FEATURE_STATE = 'active';
const IF_ACTIVE = (activeProp) =>  [['boolean', ['feature-state', ACTIVE_FEATURE_STATE], false], activeProp];

const IF_HAS_PROPERTY = (prop, defaultValue) => {
  return [['has', prop], ['get', prop], defaultValue];
};

const linePaint = {
  'line-color': [
    'case',
    ...IF_ACTIVE('blue'),
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

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const FeatureLayer = ({ symbols, lines, polygons, mapNameLayout, map }) => {
  const layout = {
    ...symbolLayout,
    ...mapNameLayout,
  };

  addFeatureCollectionImagesToMap(symbols, map);
  
  const lineData = {
    type: 'geojson',
    data: lines,
  };

  const polygonData = {
    type: 'geojson',
    data: polygons,
  };

  const symbolData = {
    type: 'geojson',
    data: symbols,
  };


  return <Fragment>
    <Source id='feature-line-source' geoJsonSource={lineData} />
    <Source id='feature-polygon-source' geoJsonSource={polygonData} />
    <Source id='feature-symbol-source' geoJsonSource={symbolData} />

    <Layer sourceId='feature-polygon-source' type='fill'
      id={FEATURE_FILLS} before={SUBJECT_SYMBOLS}
      paint={fillPaint} layout={fillLayout}/>

    <Layer sourceId='feature-line-source' type='line'
      id={FEATURE_LINES} before={SUBJECT_SYMBOLS}
      paint={linePaint} layout={lineLayout}/>

    <Layer sourceId='feature-symbol-source' type='symbol'
      id={FEATURE_SYMBOLS}
      paint={symbolPaint} layout={layout}/>
  </Fragment>;
};

FeatureLayer.propTypes = {
  symbols: PropTypes.object.isRequired,
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default memo(withMap(withMapNames(FeatureLayer)));