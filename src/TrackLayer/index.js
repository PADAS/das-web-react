import React, { memo, Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import { withMap } from '../EarthRangerMap';
import { LAYER_IDS } from '../constants';
import { addAndCacheMapImage } from '../utils/map';
import { convertTrackFeatureCollectionToPoints } from '../utils/tracks';
import Arrow from '../common/images/icons/track-arrow.svg';

const ARROW_IMG_ID = 'track_arrow';
const { TRACKS_LINES, TRACK_TIMEPOINTS_SYMBOLS, SUBJECT_SYMBOLS } = LAYER_IDS;

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-timepoint'))[0];

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

const TracksLayer = memo(function TracksLayer(props) {
  const { map, onPointClick, trackCollection, showTimepoints, trackLength, ...rest } = props;
  const tracksAsPoints = convertTrackFeatureCollectionToPoints(trackCollection);
  const onSymbolClick = e => onPointClick(getPointLayer(e, map));
  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const addImage = async () => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addAndCacheMapImage(map, ARROW_IMG_ID, Arrow);
    }
  };

  const trackData = {
    type: 'geojson',
    data: trackCollection,
  };

  const trackPointData = {
    type: 'geojson',
    data: tracksAsPoints,
  };

  useEffect(() => {
    addImage();
  }, []);

  return (
    <Fragment>
      <Source id='track-source' geoJsonSource={trackData} />
      <Source id='track-point-source' geoJsonSource={trackPointData} />

      <Layer sourceId='track-source' type='line' before={SUBJECT_SYMBOLS}
        paint={trackLayerLinePaint} layout={trackLayerLineLayout} id={TRACKS_LINES} {...rest} />

      {showTimepoints && <Layer sourceId='track-point-source' type='symbol' before={SUBJECT_SYMBOLS}
        onMouseEnter={onSymbolMouseEnter}
        onMouseLeave={onSymbolMouseLeave}
        onClick={onSymbolClick} layout={timepointLayerLayout} id={TRACK_TIMEPOINTS_SYMBOLS} {...rest} />}

    </Fragment>
  );
});

export default withMap(TracksLayer);

TracksLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
  trackCollection: PropTypes.object.isRequired,
};