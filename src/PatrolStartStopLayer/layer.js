import React, { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import isAfter from 'date-fns/is_after';

import { Source, Layer } from 'react-mapbox-gl';

import { addMapImage } from '../utils/map';
import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import { withMap } from '../EarthRangerMap';
import { assemblePatrolDataForPatrol, getTrackForPatrolFromProps, getLeaderForPatrolFromProps } from '../selectors/patrols';
import { drawLinesBetweenPatrolTrackAndPatrolPoints, extractPatrolPointsFromTrackData } from '../utils/patrols';
import { uuid } from '../utils/string';
import { trackTimeEnvelope } from '../selectors/tracks';
import { getTimeSliderState } from '../selectors';
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
  const { allowOverlap, key, patrol, leader, rawTrack, map, mapUserLayoutConfig, timeSliderState, trackTimeEnvelope, ...rest } = props;

  const [ layerIds, setLayerIds ] = useState(null);
  const [instanceId] = useState(uuid());
  const layerId = `patrol-start-stop-layer-${instanceId}`;

  const patrolData = useMemo(() => assemblePatrolDataForPatrol(patrol, leader, rawTrack), [leader, patrol, rawTrack]);

  const patrolStartStopData = useMemo(() => {
    const points = extractPatrolPointsFromTrackData(patrolData, rawTrack);

    const timeSliderActiveWithVirtualDate = (timeSliderState.active && timeSliderState.virtualDate);

    if (!points) return null;

    if (points.start_location
      && points.start_location.properties.time) {
      const startDate = new Date(points.start_location.properties.time);
      if (timeSliderActiveWithVirtualDate && isAfter(startDate, new Date(timeSliderState.virtualDate))) {
        delete points.start_location;
      }
    }
    if (points.end_location
      && points.end_location.properties.time) {
      const endDate = new Date(points.end_location.properties.time);

      if (timeSliderActiveWithVirtualDate && isAfter(endDate, new Date(timeSliderState.virtualDate))) {
        delete points.end_location;
      }
    }

    if (!points.start_location && !points.end_location) return null;

    const lines = drawLinesBetweenPatrolTrackAndPatrolPoints(points, patrolData.trackData);

    return {
      points,
      lines,
    };
  } , [patrolData, rawTrack, timeSliderState.active, timeSliderState.virtualDate]);

  useEffect(() => {
    if (patrolStartStopData) {
      const { points: { start_location } } = patrolStartStopData;

      const image = start_location?.properties?.image;
      const imgHeight = start_location?.properties?.height;
      const imgWidth = start_location?.properties?.imgWidth;

      const imgUrl = calcImgIdFromUrlForMapImages(image, imgWidth, imgHeight);

      if (!map.hasImage(imgUrl)) {
        addMapImage({ src: image });
      }

    }
  }, [map, patrolStartStopData]);
  
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
    return !!patrolStartStopData && [
      ...Object.values(patrolStartStopData.points),
      patrolStartStopData.lines,
    ].filter(val => !!val);
  }, [patrolStartStopData]);

  const patrolPointsSourceData = useMemo(() => {
    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: patrolPointFeatures,
      }
    };
  }, [patrolPointFeatures]);

  if (!patrolStartStopData) return null;

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

const mapStateToProps = (state, props) => ({
  leader: getLeaderForPatrolFromProps(state, props),
  rawTrack: getTrackForPatrolFromProps(state, props),
  trackTimeEnvelope: trackTimeEnvelope(state),
  timeSliderState: getTimeSliderState(state),
});

/* const mapStateToProps = (state, props) => {
  leader: getLeaderForPatrolFromProps(state, props),
  rawTrack: getTrackForPatrolFromProps(state, props),
}

  const patrolData = assemblePatrolDataForPatrol(patrol, leader, rawTrack);

  const { indices } = patrolData.trackData;

  if (indices) {

  }

const trimmedTrackData = useMemo(() => !!trackData && trimTrackDataToTimeRange(trackData, trackTimeEnvelope.from, trackTimeEnvelope.until), [trackData, trackTimeEnvelope.from, trackTimeEnvelope.until]);

 */


export default connect(mapStateToProps, null)(withMap(
  memo(withMapViewConfig(StartStopLayer))));
