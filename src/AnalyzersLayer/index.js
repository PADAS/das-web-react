import React, { memo, useMemo } from 'react';
import withMapViewConfig from '../WithMapViewConfig';

import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const { ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL, ANALYZER_LINES_WARNING,
  ANALYZER_LINES_CRITICAL, SKY_LAYER } = LAYER_IDS;
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
    layerGroups, onAnalyzerGroupEnter, onAnalyzerGroupExit, onAnalyzerFeatureClick, isSubjectSymbolsLayerReady }
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

  const layerConfig = useMemo(() => ({
    before: SKY_LAYER,
    minZoom,
    condition: !!isSubjectSymbolsLayerReady,
  }), [isSubjectSymbolsLayerReady, minZoom]);

  useMapSource(ANALYZER_POLYS_WARNING_SOURCE, warningPolys);
  useMapLayer(
    ANALYZER_POLYS_WARNING,
    'line',
    ANALYZER_POLYS_WARNING_SOURCE,
    linePaint,
    undefined,
    layerConfig,
  );

  useMapSource(ANALYZER_POLYS_CRITICAL_SOURCE, criticalPolys);
  useMapLayer(
    ANALYZER_POLYS_CRITICAL,
    'line',
    ANALYZER_POLYS_CRITICAL_SOURCE,
    criticalLinePaint, lineLayout,
    layerConfig,
  );

  useMapSource(ANALYZER_LINES_WARNING_SOURCE, warningLines);
  useMapLayer(
    ANALYZER_LINES_WARNING,
    'line',
    ANALYZER_LINES_WARNING_SOURCE,
    linePaint,
    lineLayout,
    layerConfig,
  );

  useMapSource(ANALYZER_LINES_CRITICAL_SOURCE, criticalLines);
  useMapLayer(
    ANALYZER_LINES_CRITICAL,
    'line',
    ANALYZER_LINES_CRITICAL_SOURCE,
    criticalLinePaint,
    lineLayout,
    layerConfig,
  );

  // (eventType = 'click', handlerFn = noop, layerId = null, condition = true)
  useMapEventBinding('mouseenter', onAnalyzerFeatureEnter, ANALYZER_POLYS_WARNING);
  useMapEventBinding('mouseenter', onAnalyzerFeatureEnter, ANALYZER_POLYS_CRITICAL);
  useMapEventBinding('mouseenter', onAnalyzerFeatureEnter, ANALYZER_LINES_WARNING);
  useMapEventBinding('mouseenter', onAnalyzerFeatureEnter, ANALYZER_LINES_CRITICAL);

  useMapEventBinding('mouseleave', onAnalyzerFeatureExit, ANALYZER_POLYS_WARNING);
  useMapEventBinding('mouseleave', onAnalyzerFeatureExit, ANALYZER_POLYS_CRITICAL);
  useMapEventBinding('mouseleave', onAnalyzerFeatureExit, ANALYZER_LINES_WARNING);
  useMapEventBinding('mouseleave', onAnalyzerFeatureExit, ANALYZER_LINES_CRITICAL);

  useMapEventBinding('click', onAnalyzerFeatureClick, ANALYZER_POLYS_WARNING);
  useMapEventBinding('click', onAnalyzerFeatureClick, ANALYZER_POLYS_CRITICAL);
  useMapEventBinding('click', onAnalyzerFeatureClick, ANALYZER_LINES_WARNING);
  useMapEventBinding('click', onAnalyzerFeatureClick, ANALYZER_LINES_CRITICAL);

  return null;
};

export default memo(withMapViewConfig(AnalyzerLayer));