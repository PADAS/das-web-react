import React, { memo, useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolMapTrackData } from '../selectors/patrols';
import { LAYER_IDS } from '../constants';
import { MapContext } from '../MapContext';

import TrackLayer from '../TracksLayer/track';

const LINE_PAINT = {
  'line-width': ['step', ['zoom'], 2, 8, ['+', ['get', 'stroke-width'], 1.5]],
  'line-offset': -0.75,
  'line-opacity': 1,
};

const getPointLayer = (event, map) => map.queryRenderedFeatures(event.point)
  .filter((item) => item.layer.id.includes(LAYER_IDS.TRACK_TIMEPOINTS))[0];

const PatrolTrackLayer = ({ onPointClick, patrol, ...restProps }) => {
  const map = useContext(MapContext);

  const patrolMapTrackData = useSelector((state) => selectPatrolMapTrackData(state, patrol));
  const showTrackTimepoints = useSelector((state) => state.view.showTrackTimepoints);

  // A subject's own line, whatever legs of the patrol it took part in: its
  // colour tells it apart from the rest of the team's.
  return patrolMapTrackData.subjectsTrackData
    .filter((subjectTrackData) => !subjectTrackData.isHidden && !!subjectTrackData.trackData)
    .map((subjectTrackData) => <TrackLayer
      id={`${patrol.id}-${subjectTrackData.subject.id}`}
      key={subjectTrackData.subject.id}
      linePaint={LINE_PAINT}
      onPointClick={(event) => onPointClick(getPointLayer(event, map))}
      showTimepoints={showTrackTimepoints}
      trackData={subjectTrackData.trackData}
      {...restProps}
    />);
};

export default memo(PatrolTrackLayer);
