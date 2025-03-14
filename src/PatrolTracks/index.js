import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolsWithTracks } from '../selectors/patrols';
import { selectTrackTimeEnvelope } from '../selectors/tracks';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const patrolsWithTracks = useSelector(selectPatrolsWithTracks);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);

  return patrolsWithTracks.map((patrol, index) => <PatrolTrackLayer
    key={`patrol-track-${patrol.id}-${index}`}
    patrol={patrol}
    trackTimeEnvelope={trackTimeEnvelope}
    {...props}
  />);
};

export default memo(PatrolTracks);
