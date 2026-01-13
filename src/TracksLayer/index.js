import React, { memo, useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { addMapImage } from '../utils/map';
import { LAYER_IDS } from '../constants';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';
import { selectSubjectTracksWithPatrolTrackShownFlag } from '../selectors/patrols';

import Arrow from '../common/images/icons/track-arrow.svg';
import TrackLayer from './track';

const ARROW_IMG_ID = 'track_arrow';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const TracksLayer = ({ onPointClick, onTrackLabelClick, showTimepoints = true }) => {
  const map = useContext(MapContext);

  const subjectTracksWithPatrolTrackShownFlag = useSelector(selectSubjectTracksWithPatrolTrackShownFlag);

  const onTimepointClick = useCallback((event) => {
    const layer = map.queryRenderedFeatures(event.point)
      .filter((item) => item.layer.id.includes(LAYER_IDS.TRACK_TIMEPOINTS))[0];
    onPointClick(layer);

    mapLayerTracker.track('Clicked Track Timepoint');
  }, [map, onPointClick]);

  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ src: Arrow, id: ARROW_IMG_ID });
    }
  }, [map]);

  return subjectTracksWithPatrolTrackShownFlag.length > 0
    ? subjectTracksWithPatrolTrackShownFlag.map((subjectTracks) => <TrackLayer
      id={subjectTracks.track.features[0].properties.id}
      key={`track-layer-${subjectTracks.track.features[0].properties.id}`}
      linePaint={{ 'line-opacity': subjectTracks.patrolTrackShown ? 0.4 : 1 }}
      onPointClick={onTimepointClick}
      onTrackLabelClick={onTrackLabelClick}
      showTimepoints={showTimepoints}
      trackData={subjectTracks}
    />)
    : null;
};

export default memo(TracksLayer);
