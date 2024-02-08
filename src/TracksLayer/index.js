import React, { memo, useCallback, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { addMapImage } from '../utils/map';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';
import { visibleTrackDataWithPatrolAwareness } from '../selectors/patrols';

import Arrow from '../common/images/icons/track-arrow.svg';
import TrackLayer from './track';

const ARROW_IMG_ID = 'track_arrow';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const TracksLayer = ({ onPointClick, showTimepoints }) => {
  const map = useContext(MapContext);

  const trackData = useSelector(visibleTrackDataWithPatrolAwareness);

  const onTimepointClick = useCallback((event) => {
    const layer = map.queryRenderedFeatures(event.point)
      .filter((item) => item.layer.id.includes('track-layer-points-'))[0];
    onPointClick(layer);

    mapLayerTracker.track('Clicked Track Timepoint');
  }, [map, onPointClick]);

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ src: Arrow, id: ARROW_IMG_ID });
    }
  }, [map]);

  return trackData.length > 0 ? trackData.map((data) => <TrackLayer
    key={`track-layer-${data.track.features[0].properties.id}`}
    linePaint={{ 'line-opacity': data.patrolTrackShown ? 0.4 : 1 }}
    onPointClick={onTimepointClick}
    showTimepoints={showTimepoints}
    trackData={data}
  />) : null;
};

TracksLayer.defaultProps = {
  showTimepoints: true,
};

TracksLayer.propTypes = {
  onPointClick: PropTypes.func.isRequired,
  showTimepoints: PropTypes.bool,
};

export default memo(TracksLayer);
