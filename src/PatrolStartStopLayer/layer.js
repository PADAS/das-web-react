import React, { memo, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { addMapImage } from '../utils/map';
import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { selectPatrolData } from '../selectors/patrols';
import { DEFAULT_SYMBOL_PAINT, LAYER_IDS } from '../constants';
import { uuid } from '../utils/string';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';
import { MapContext } from '../App';
import withMapViewConfig from '../WithMapViewConfig';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

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

const textLayout = {
  'text-field': '{title}',
};

const symbolFilter = ['==', ['geometry-type'], 'Point'];


const StartStopLayer = ({ patrolData, ...rest }) => {
  const map = useContext(MapContext);

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

  const layerSymbolPaint = useMemo(() => ({ ...symbolPaint, 'text-color': ['get', 'stroke'] }), []);
  const layerLinePaint = useMemo(() => ({ ...linePaint, 'line-color': ['get', 'stroke'] }), []);

  useMapSources([{ id: sourceId, data: patrolPointsSourceData }]);
  useMapLayers([{
    id: `${layerId}-lines`,
    type: 'line',
    sourceId,
    paint: layerLinePaint,
    layout: lineLayout
  }]);

  if (!points && !lines) return null;

  return <LabeledPatrolSymbolLayer paint={layerSymbolPaint} sourceId={sourceId} type='symbol'
      id={layerId} filter={symbolFilter} textLayout={textLayout} {...rest}
    />;
};

const makeMapStateToProps = () => {
  const mapStateToProps = (state, props) => {
    return {
      patrolData: selectPatrolData(state, props.patrol),
    };
  };
  return mapStateToProps;
};


export default connect(makeMapStateToProps, null)(memo(withMapViewConfig(StartStopLayer)));
