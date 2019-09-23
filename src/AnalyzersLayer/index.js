import React, { memo, Fragment } from 'react';
import { Source, Layer, GeoJSONLayer } from 'react-mapbox-gl';

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
    ...IF_HAS_PROPERTY('fill-opacity', .25),
  ],
};

const criticalPolyPaint = {
  'fill-color': [
    'case',
    ...IF_HAS_STATE('active', 'red', '#CCC'),
  ],
  'fill-opacity': [
    'case',
    ...IF_HAS_PROPERTY('fill-opacity', .25),
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

  // hold state of feature group
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

  // const warningLinesData = {
  //   type: 'geojson',
  //   data: warningLines,
  // };

  // const criticalLinesData = {
  //   type: 'geojson',
  //   data: criticalLines,
  // };

  // const warningPolysData = {
  //   type: 'geojson',
  //   data: warningPolys,
  // };

  // const criticalPolysData = {
  //   type: 'geojson',
  //   data: criticalPolys,
  // };

  return <Fragment>
    {/* <Source id='analyzer-polygon-warning-source' geoJsonSource={warningLinesData} />
    <Source id='analyzer-polygon-critical-source' geoJsonSource={criticalPolysData} />
    <Source id='analyzer-line-warning-source' geoJsonSource={warningLinesData} />
    <Source id='analyzer-line-critical-source' geoJsonSource={criticalLinesData} />

    <Layer sourceId='analyzer-polygon-warning-source' type='line'
      id={ANALYZER_POLYS_WARNING} 
      paint={linePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerClick}/>

    <Layer sourceId='analyzer-polygon-critical-source' type='line'
      id={ANALYZER_POLYS_CRITICAL} 
      paint={criticalLinePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerClick}/>

    <Layer sourceId='analyzer-line-warning-source' type='line'
      id={ANALYZER_LINES_WARNING}
      paint={linePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerClick}/>

    <Layer sourceId='analyzer-line-critical-source' type='line'
      id={ANALYZER_LINES_CRITICAL} 
      paint={criticalLinePaint} layout={lineLayout}
      onMouseEnter={onAnalyzerFeatureEnter}
      onMouseLeave={onAnalyzerFeatureExit}
      onClick={onAnalyzerClick}/>  */}

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