import React, { Fragment, memo, useMemo, useState } from 'react';

import { Source, Layer } from 'react-mapbox-gl';

import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import { withMap } from '../EarthRangerMap';
import { uuid } from '../utils/string';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import withMapViewConfig from '../WithMapViewConfig';

const linePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-dasharray': [1, 2],
  'line-width': ['step', ['zoom'], 2, 8, 2.5],
  'line-offset': -0.75,
  'line-opacity': 0.8,
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-color': '#ffffff',
  'text-halo-blur': 0.5,
  'text-halo-color': 'rgba(0,0,0,0.7)',
  'text-halo-width': 0.5,
};

const labelPaint = {
  'icon-opacity': 1,
  'text-color': '#ffffff',
  'text-halo-color': 'rgba(0,0,0,0.7)',
};


const StartStopLayer = (props) => {
  const { allowOverlap, key, data: { points, lines }, map, mapUserLayoutConfig, ...rest } = props;

  const [ layerIds, setLayerIds ] = useState(null);
  const [instanceId] = useState(uuid());
  const layerId = `patrol-start-stop-layer-${instanceId}`;

  const layoutConfig = allowOverlap ? {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    ...mapUserLayoutConfig,
  } : { ...mapUserLayoutConfig };

  const layout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layoutConfig,
  };

  const sourceId = `patrol-symbol-source-${instanceId}`;

  const patrolPointFeatures = useMemo(() => {
    return [
      ...Object.values(points),
      lines,
    ].filter(val => !!val);
  }, [lines, points]);

  const patrolPointsSourceData = useMemo(() => {
    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: patrolPointFeatures,
      }
    };
  }, [patrolPointFeatures]);

  const layerSymbolPaint = { ...symbolPaint, 'text-color':  ['get', 'stroke'] };
  const layerLabelPaint = { ...labelPaint, 'icon-color': ['get', 'stroke'] };

  const layerLinePaint = { ...linePaint, 'line-color': ['get', 'stroke'] };

  return <Fragment key={`${key}-${instanceId}`}>
    <Source id={sourceId} geoJsonSource={patrolPointsSourceData} />
    <LabeledPatrolSymbolLayer textPaint={layerLabelPaint} layout={layout} paint={layerSymbolPaint} sourceId={sourceId} type='symbol'
      id={layerId} onInit={setLayerIds} filter={['==', ['geometry-type'], 'Point']}  {...rest}
    />
    <Layer sourceId={sourceId} id={`${layerId}-lines`} type='line' paint={layerLinePaint} layout={lineLayout} />
  </Fragment>;
};



export default withMap(
  memo(withMapViewConfig(StartStopLayer)));
