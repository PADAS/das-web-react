import React, { memo, useCallback, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import debounceRender from 'react-debounce-render';

import { withMap } from '../EarthRangerMap';
import { addMapImage } from '../utils/map';
import Arrow from '../common/images/icons/track-arrow.svg';

import { trimmedVisibleTrackFeatureCollection, trimmedVisibleTrackPointFeatureCollection } from '../selectors/tracks';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';

const { TRACKS_LINES, TRACK_TIMEPOINTS_SYMBOLS, SUBJECT_SYMBOLS } = LAYER_IDS;

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
  const { map, onPointClick, trackCollection, trackPointCollection, dispatch:_dispatch, showTimepoints, ...rest } = props;

  const onSymbolMouseEnter = useCallback(() => map.getCanvas().style.cursor = 'pointer', [map]);
  const onSymbolMouseLeave = useCallback(() => map.getCanvas().style.cursor = '', [map]);

  const trackData = {
    type: 'geojson',
    data: trackCollection,
  };

  const trackPointData = {
    type: 'geojson',
    data: trackPointCollection,
  };

  const sourceId = `${TRACKS_LINES}_SOURCE`;
  const pointSourceId = `${TRACK_TIMEPOINTS_SYMBOLS}_SOURCE`;

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage(Arrow, ARROW_IMG_ID);
    }
  }, []); // eslint-disable-line


  return <Fragment>
    <Source id={sourceId} geoJsonSource={trackData} />
    <Source id={pointSourceId} geoJsonSource={trackPointData} />
    <Layer sourceId={sourceId} type='line' before={SUBJECT_SYMBOLS}
      paint={trackLayerLinePaint} layout={trackLayerLineLayout} id={TRACKS_LINES} {...rest} />
    {showTimepoints && <Layer sourceId={pointSourceId} type='symbol' before={SUBJECT_SYMBOLS}
      onMouseEnter={onSymbolMouseEnter}
      onMouseLeave={onSymbolMouseLeave}
      onClick={onPointClick} layout={timepointLayerLayout} id={TRACK_TIMEPOINTS_SYMBOLS} {...rest} />}
  </Fragment>;

  

  // return <Fragment>{trackIds.map(id => <TrackLayer key={`track-layer-${id}`} map={map} onPointClick={onSymbolClick} showTimepoints={showTimepoints} trackId={id} />)}</Fragment>;
};

const mapStateToProps = (state) => ({
  trackCollection: trimmedVisibleTrackFeatureCollection(state),
  trackPointCollection: trimmedVisibleTrackPointFeatureCollection(state),
});

export default debounceRender(withMap(
  memo(
    connect(mapStateToProps, null)(TracksLayer)
  )
), 16.666);

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


/* 
TRACK LAYER track.js file graveyard

import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { trimmedTrack, trimmedTrackPoints } from '../selectors/tracks';

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

 */