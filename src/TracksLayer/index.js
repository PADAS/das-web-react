import React, { memo, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import { LAYER_IDS } from '../constants';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../MapContext';
import { selectSubjectTracksWithPatrolTrackShownFlag } from '../selectors/patrols';

import TrackLayer from './track';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const TracksLayer = ({ onPointClick, showTimepoints = true }) => {
  const map = useContext(MapContext);

  const subjectTracksWithPatrolTrackShownFlag = useSelector(selectSubjectTracksWithPatrolTrackShownFlag);

  const onTimepointClick = useCallback((event) => {
    const layer = map.queryRenderedFeatures(event.point)
      .filter((item) => item.layer.id.includes(LAYER_IDS.TRACK_TIMEPOINTS))[0];
    onPointClick(layer);

    mapLayerTracker.track('Clicked Track Timepoint');
  }, [map, onPointClick]);

  return subjectTracksWithPatrolTrackShownFlag.length > 0
    ? subjectTracksWithPatrolTrackShownFlag.map((subjectTracks) => <TrackLayer
      id={subjectTracks.track.features[0].properties.id}
      key={`track-layer-${subjectTracks.track.features[0].properties.id}`}
      linePaint={{ 'line-opacity': subjectTracks.patrolTrackShown ? 0.4 : 1 }}
      onPointClick={onTimepointClick}
      showTimepoints={showTimepoints}
      trackData={subjectTracks}
    />)
    : null;
};

export default memo(TracksLayer);
