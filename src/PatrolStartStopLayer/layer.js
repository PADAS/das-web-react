import React, { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { Source, Layer } from 'react-mapbox-gl';

import { addMapImage } from '../utils/map';
import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { createPatrolDataSelector } from '../selectors/patrols';
import { DEFAULT_SYMBOL_PAINT } from '../constants';
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
  const { key, patrolData, map, ...rest } = props;

  const [instanceId] = useState(uuid());
  const layerId = `patrol-start-stop-layer-${instanceId}`;

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

  const patrolPointsSourceData = useMemo(() => {
    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: patrolPointFeatures,
      }
    };
  }, [patrolPointFeatures]);

  if (!points && !lines) return null;

  const layerSymbolPaint = { ...symbolPaint, 'text-color': ['get', 'stroke'] };
  const layerLabelPaint = { ...labelPaint, 'icon-color': ['get', 'stroke'] };

  const layerLinePaint = { ...linePaint, 'line-color': ['get', 'stroke'] };

  return <Fragment key={`${key}-${instanceId}`}>
    <Source id={sourceId} geoJsonSource={patrolPointsSourceData} />
    <LabeledPatrolSymbolLayer textPaint={layerLabelPaint} paint={layerSymbolPaint} sourceId={sourceId} type='symbol'
      id={layerId} filter={['==', ['geometry-type'], 'Point']}  {...rest}
    />
    <Layer sourceId={sourceId} id={`${layerId}-lines`} type='line' paint={layerLinePaint} layout={lineLayout} />
  </Fragment>;
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
