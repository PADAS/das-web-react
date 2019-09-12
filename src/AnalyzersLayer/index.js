import React, { memo, Fragment } from 'react';
import { GeoJSONLayer } from 'react-mapbox-gl';

import { LAYER_IDS } from '../constants';

const { ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL, ANALYZER_LINES_WARNING, ANALYZER_LINES_CRITICAL} = LAYER_IDS;

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

const criticalPolyPaint = {
  'fill-color': [
    'case',
    ...IF_HAS_STATE('active', 'red', '#CCC'),
  ],
  'fill-opacity': [
    'case',
    ...IF_HAS_PROPERTY('fill-opacity', 0),
  ],
};

const polyLayout = {
  'visibility': 'visible',
};

const AnalyzerLayer = memo(({ warningLines, criticalLines, warningPolys, criticalPolys, layerGroups, onAnalyzerGroupEnter, onAnalyzerGroupExit, onAnalyzerFeatureClick, map }) => {

  // XXX better way to do this?
  const getLayerGroup = (featureId) => {
    const featureGroup = []
    layerGroups.forEach( (analyzer) => {
      if (analyzer.feature_ids.includes(featureId)) {
        featureGroup.push(...analyzer.feature_ids);
      }});
    return featureGroup;
  };

  // loosely inspired from https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/
  let hoverStateIds;

  const onAnalyzerClick = (e) => {
    onAnalyzerFeatureClick(e);
  }

  const onAnalyzerFeatureEnter = (e) => {
    const featureId = e.features[0].properties.id;
    hoverStateIds = getLayerGroup(featureId);
    onAnalyzerGroupEnter(e, hoverStateIds);
  }

  const onAnalyzerFeatureExit = (e) => {
    onAnalyzerGroupExit(e, hoverStateIds);
  }

  return <Fragment>
    <GeoJSONLayer id={ANALYZER_POLYS_WARNING} data={warningPolys}
      fillPaint={polyPaint}
      fillLayout={polyLayout}
      fillOnClick={onAnalyzerClick}
    />
    <GeoJSONLayer id={ANALYZER_POLYS_CRITICAL} data={criticalPolys}
      fillPaint={criticalPolyPaint}
      fillLayout={polyLayout}
      fillOnClick={onAnalyzerClick}
    />
    <GeoJSONLayer id={ANALYZER_LINES_WARNING} data={warningLines}
      lineLayout={lineLayout}
      linePaint={linePaint}
      lineOnMouseEnter={onAnalyzerFeatureEnter}
      lineOnMouseLeave={onAnalyzerFeatureExit}
      lineOnClick={onAnalyzerClick}
    />
    <GeoJSONLayer id={ANALYZER_LINES_CRITICAL} data={criticalLines}
      lineLayout={lineLayout}
      linePaint={criticalLinePaint}
      lineOnMouseEnter={onAnalyzerFeatureEnter}
      lineOnMouseLeave={onAnalyzerFeatureExit}
      lineOnClick={onAnalyzerClick}
    />
  </Fragment>
});


export default AnalyzerLayer;