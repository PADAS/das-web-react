import React, { memo, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { addMapImage } from '../utils/map';
import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { createPatrolDataSelector } from '../selectors/patrols';
import { DEFAULT_SYMBOL_PAINT, LAYER_IDS } from '../constants';
import { withMap } from '../EarthRangerMap';
import { uuid } from '../utils/string';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import withMapViewConfig from '../WithMapViewConfig';
import { useMapLayer, useMapSource } from '../hooks';

const { PATROL_SYMBOLS } = LAYER_IDS;

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

const symbolFilter = ['==', ['geometry-type'], 'Point'];


const StartStopLayer = (props) => {
  const { key, patrolData, map, ...rest } = props;

  const [instanceId] = useState(uuid());
  const layerId = `${PATROL_SYMBOLS}-${instanceId}`;

  const points = patrolData?.startStopGeometries?.points;
  const lines = patrolData?.startStopGeometries?.lines;

  useEffect(() => {
    const start_location = patrolData?.startStopGeometries?.points?.start_location;

    if (start_location) {

      const image = start_location?.properties?.image;
      const imgHeight = start_location?.properties?.height;
      const imgWidth = start_location?.properties?.imgWidth;

      const imgUrl = calcImgIdFromUrlForMapImages(image, imgWidth, imgHeight);

      if (!map.hasImage(imgUrl)) {
        addMapImage({ src: image });
      }

    }
  }, [map, patrolData]);

  const sourceId = `patrol-symbol-source-${instanceId}`;

  const patrolPointFeatures = useMemo(() => {
    return [
      ...Object.values(points || {}),
      lines,
    ].filter(val => !!val);
  }, [lines, points]);

  const patrolPointsSourceData = useMemo(() => ({
    type: 'FeatureCollection',
    features: patrolPointFeatures,
  }), [patrolPointFeatures]);

  const layerLabelPaint = useMemo(() => ({ ...labelPaint, 'icon-color': ['get', 'stroke'] }), []);
  const layerSymbolPaint = useMemo(() => ({ ...symbolPaint, 'text-color': ['get', 'stroke'] }), []);
  const layerLinePaint = useMemo(() => ({ ...linePaint, 'line-color': ['get', 'stroke'] }), []);

  useMapSource(sourceId, patrolPointsSourceData);
  useMapLayer(`${layerId}-lines`, 'line', sourceId, layerLinePaint, lineLayout);

  if (!points && !lines) return null;

  return <LabeledPatrolSymbolLayer textPaint={layerLabelPaint} paint={layerSymbolPaint} sourceId={sourceId} type='symbol'
      id={layerId} filter={symbolFilter}  {...rest}
    />;
};

const makeMapStateToProps = () => {
  const getDataForPatrolFromProps = createPatrolDataSelector();
  const mapStateToProps = (state, props) => {
    return {
      patrolData: getDataForPatrolFromProps(state, props),
    };
  };
  return mapStateToProps;
};


export default connect(makeMapStateToProps, null)(memo(withMap(withMapViewConfig(StartStopLayer))));
