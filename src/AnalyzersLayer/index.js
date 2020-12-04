import React, { memo, Fragment } from 'react';
import { Source, Layer } from 'react-mapbox-gl';

import withMapViewConfig from '../WithMapViewConfig';

import { LAYER_IDS, SOURCE_IDS } from '../constants';

const { ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL, ANALYZER_LINES_WARNING,
  ANALYZER_LINES_CRITICAL, SUBJECT_SYMBOLS } = LAYER_IDS;
const { ANALYZER_POLYS_WARNING_SOURCE, ANALYZER_POLYS_CRITICAL_SOURCE,
  ANALYZER_LINES_CRITICAL_SOURCE, ANALYZER_LINES_WARNING_SOURCE } = SOURCE_IDS;

const IF_HAS_STATE = (stateType, activeProp, defaultProp) => [['boolean', ['feature-state', stateType], false], activeProp, defaultProp];

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

const AnalyzerLayer = (
  { warningLines, criticalLines, warningPolys, criticalPolys, minZoom,
    layerGroups, onAnalyzerGroupEnter, onAnalyzerGroupExit, onAnalyzerFeatureClick, map }
) => {

  const getLayerGroup = featureId => layerGroups
    .filter(group => !!group.feature_ids.includes(featureId))
    .reduce((accumulator, group) => [...accumulator, ...group.feature_ids], []);

  // hold state of feature group
  let hoverStateIds;

  const onAnalyzerFeatureEnter = (e) => {
    const featureId = e.features[0].properties.id;
    hoverStateIds = getLayerGroup(featureId);
    onAnalyzerGroupEnter(e, hoverStateIds);
  };

  const onAnalyzerFeatureExit = (e) => {
    onAnalyzerGroupExit(e, hoverStateIds);
  };

  const warningLinesData = {
    type: 'geojson',
    data: warningLines,
  };

  const criticalLinesData = {
    type: 'geojson',
    data: criticalLines,
  };

  const warningPolysData = {
    type: 'geojson',
    data: warningPolys,
  };

  const criticalPolysData = {
    type: 'geojson',
    data: criticalPolys,
  };

  return <Fragment>
    <Source id={ANALYZER_POLYS_WARNING_SOURCE} geoJsonSource={warningPolysData} />
    <Source id={ANALYZER_POLYS_CRITICAL_SOURCE} geoJsonSource={criticalPolysData} />
    <Source id={ANALYZER_LINES_CRITICAL_SOURCE} geoJsonSource={warningLinesData} />
    <Source id={ANALYZER_LINES_WARNING_SOURCE} geoJsonSource={criticalLinesData} />

    {/* due to a bug in mapboxgl, we need to treat polys as lines, to 
     get a dotted border line to appear*/}

    <Layer minZoom={minZoom} sourceId={ANALYZER_POLYS_WARNING_SOURCE} type='line'
      id={ANALYZER_POLYS_WARNING}
      paint={linePaint}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerFeatureClick} />

    <Layer minZoom={minZoom} sourceId={ANALYZER_POLYS_CRITICAL_SOURCE} type='line'
      before={SUBJECT_SYMBOLS}
      id={ANALYZER_POLYS_CRITICAL}
      paint={criticalLinePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerFeatureClick} />

    <Layer minZoom={minZoom} sourceId={ANALYZER_LINES_CRITICAL_SOURCE} type='line'
      before={SUBJECT_SYMBOLS}
      id={ANALYZER_LINES_WARNING}
      paint={linePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerFeatureClick} />

    <Layer minZoom={minZoom} sourceId={ANALYZER_LINES_WARNING_SOURCE} type='line'
      before={SUBJECT_SYMBOLS}
      id={ANALYZER_LINES_CRITICAL}
      paint={criticalLinePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerFeatureClick} />
  </Fragment>;
};

export default memo(withMapViewConfig(AnalyzerLayer));