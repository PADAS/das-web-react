import React, { memo, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';
import { addMapImage } from '../utils/map';
import Arrow from '../common/images/icons/track-arrow.svg';

import { trimmedVisibleTrackFeatureCollection, trimmedVisibleTrackPointFeatureCollection } from '../selectors/tracks';

import TrackLayer from './track';
import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';

const { TRACKS_LINES, SUBJECT_SYMBOLS } = LAYER_IDS;

const trackLayerLinePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-width': ['step', ['zoom'], 1, 8, ['get', 'stroke-width']],
};

const trackLayerLineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const timepointLayerLayout = {
  'icon-allow-overlap': true,
  'icon-anchor': 'bottom',
  'icon-size': [
    'interpolate', ['linear'], ['zoom'],
    0, 0,
    10, 0,
    18, 0.75 / MAP_ICON_SCALE,
  ],
  'icon-rotate': ['get', 'bearing'],
  'icon-image': 'track_arrow',
  'icon-pitch-alignment': 'map',
  'icon-rotation-alignment': 'map',
};

const ARROW_IMG_ID = 'track_arrow';

// const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const TracksLayer = (props) => {
  const { map, onPointClick, trackCollection, trackPointCollection, dispatch:_dispatch, ...rest } = props;
  // const onSymbolClick = (e) => onPointClick(getPointLayer(e, map));

  const trackData = {
    type: 'geojson',
    data: trackCollection,
  };

  const trackPointData = {
    type: 'geojson',
    data: trackPointCollection,
  };

  const sourceId = 'tracks-source';
  const pointSourceId = 'track-points-source';

  const layerId = 'tracks-layer';
  const pointLayerId = 'track-points-layer';

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage(Arrow, ARROW_IMG_ID);
    }
  }, []); // eslint-disable-line


  return <Fragment>
    <Source id={sourceId} geoJsonSource={trackData} />
    <Source id={pointSourceId} geoJsonSource={trackPointData} />
    <Layer sourceId={sourceId} type='line' before={SUBJECT_SYMBOLS}
      paint={trackLayerLinePaint} layout={trackLayerLineLayout} id={layerId} {...rest} />
    <Layer sourceId={pointSourceId} type='symbol' before={SUBJECT_SYMBOLS}
      layout={timepointLayerLayout} id={pointLayerId} {...rest} />
  </Fragment>;

  

  // return <Fragment>{trackIds.map(id => <TrackLayer key={`track-layer-${id}`} map={map} onPointClick={onSymbolClick} showTimepoints={showTimepoints} trackId={id} />)}</Fragment>;
};

const mapStateToProps = (state) => ({
  trackCollection: trimmedVisibleTrackFeatureCollection(state),
  trackPointCollection: trimmedVisibleTrackPointFeatureCollection(state),
});

export default withMap(
  memo(
    connect(mapStateToProps, null)(TracksLayer)
  )
);

TracksLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  trackIds: PropTypes.array.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
};