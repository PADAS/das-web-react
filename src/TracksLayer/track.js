import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { trimmedTrack, trimmedTrackPoints } from '../selectors/tracks';

import { LAYER_IDS } from '../constants';

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
    18, 0.75,
  ],
  'icon-rotate': ['get', 'bearing'],
  'icon-image': 'track_arrow',
  'icon-pitch-alignment': 'map',
  'icon-rotation-alignment': 'map',
};

const TrackLayer = (props) => {
  const { map, onPointClick, trackId, trackCollection, trackPointCollection, showTimepoints, ...rest } = props;
  if (!trackCollection) return null;
  
  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const trackData = {
    type: 'geojson',
    data: trackCollection,
  };

  const trackPointData = {
    type: 'geojson',
    data: trackPointCollection,
  };

  const sourceId = `track-source-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACKS_LINES}-points-${trackId}`;

  return <Fragment>
    <Source id={sourceId} geoJsonSource={trackData} />
    <Source id={pointSourceId} geoJsonSource={trackPointData} />

    <Layer sourceId={sourceId} type='line' before={SUBJECT_SYMBOLS}
      paint={trackLayerLinePaint} layout={trackLayerLineLayout} id={layerId} {...rest} />

    {showTimepoints && <Layer sourceId={pointSourceId} type='symbol' before={SUBJECT_SYMBOLS}
      onMouseEnter={onSymbolMouseEnter}
      onMouseLeave={onSymbolMouseLeave}
      onClick={onPointClick} layout={timepointLayerLayout} id={pointLayerId} {...rest} />}

  </Fragment>;
};

const mapStateToProps = (state, props) => ({
  trackCollection: trimmedTrack(state, props),
  trackPointCollection: trimmedTrackPoints(state, props),
});

export default connect(mapStateToProps, null)(memo(TrackLayer));

TrackLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

TrackLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
  trackCollection: PropTypes.object,
  trackPointCollection: PropTypes.object,
};