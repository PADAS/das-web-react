import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

import { LAYER_IDS } from '../constants';

const { ANALYZER_POLYS, ANALYZER_LINES_WARNING, ANALYZER_LINES_CRITICAL} = LAYER_IDS;

const IF_HAS_STATE = (stateType, activeProp, defaultProp) =>  [['boolean', ['feature-state', stateType], false], activeProp, defaultProp];

const IF_HAS_PROPERTY = (prop, defaultValue) => {
  return [['has', prop], ['get', prop], defaultValue];
};

const linePaint = {
  'line-dasharray': [1, 1.5],
  'line-color': [
    'case',
    ...IF_HAS_STATE('active', 'yellow', '#CCC'), 
  ],
  'line-opacity': [
    'case',
    ...IF_HAS_PROPERTY('stroke-opacity', .75),
  ],
  'line-width': 4,
 };

 const criticalLinePaint = {
  ...linePaint,
  'line-color': [
    'case',
    ...IF_HAS_STATE('active', 'red', '#CCC'), 
  ]
 };

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const polyPaint = {
  'fill-color': [
    'case',
    ...IF_HAS_STATE('active', 'yellow', '#CCC'),
  ],
  'fill-opacity': [
    'case',
    ...IF_HAS_PROPERTY('fill-opacity', 0),
  ],
};

const polyLayout = {
  'visibility': 'visible',
};

const AnalyzerLayer = memo(({ lines, polygons, layerGroups, map }) => {

  // XXX better way to do this?
  const getLayerGroup = (feature_id) => {
    const featureSet = []
    layerGroups.forEach( (analyzer) => {
      if (analyzer.feature_ids.indexOf(feature_id) != -1) {
        featureSet.push(analyzer.feature_ids);
      }});
    return featureSet.flat(1);
  };

  // taken from https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
  var hoverStateIds, sourceName;

  const onAnalyzerClick = (e) => {
    console.log("Feature Click", e);
  }

  const onAnalyzerFeatureEnter = (e) => {
    const featureId = e.features[0].id;
    hoverStateIds = getLayerGroup(featureId);
    sourceName = e.features[0].source;
    hoverStateIds.forEach( (feature) => {
      map.setFeatureState({ source: sourceName, id: feature }, { active: true });
    });
  }

  const onAnalyzerFeatureExit = (e) => {
    hoverStateIds.forEach( (feature) => {
      map.setFeatureState({ source: sourceName, id: feature }, { active: false });
    });
  }

  return <Fragment>
    <GeoJSONLayer id={ANALYZER_POLYS} data={polygons}
      fillPaint={polyPaint}
      fillLayout={polyLayout}
      fillOnClick={onAnalyzerClick}
    />
    <GeoJSONLayer id={ANALYZER_LINES_WARNING} data={lines}
      lineLayout={lineLayout}
      linePaint={linePaint}
      lineOnMouseEnter={onAnalyzerFeatureEnter}
      lineOnMouseLeave={onAnalyzerFeatureExit}
      lineOnClick={onAnalyzerClick}
    />
    <GeoJSONLayer id={ANALYZER_LINES_CRITICAL} data={[]}
      lineLayout={lineLayout}
      linePaint={criticalLinePaint}
      lineOnMouseEnter={onAnalyzerFeatureEnter}
      lineOnMouseLeave={onAnalyzerFeatureExit}
      fillOnClick={onAnalyzerClick}
    />
  </Fragment>
});

AnalyzerLayer.propTypes = {
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default AnalyzerLayer;