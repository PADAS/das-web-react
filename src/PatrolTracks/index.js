import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { patrolsWithTrackShown } from '../selectors/patrols';
import { selectTrackTimeEnvelope } from '../selectors/tracks';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const patrols = useSelector(patrolsWithTrackShown);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);

  return patrols.map((patrol, index) => <PatrolTrackLayer
    key={`patrol-track-${patrol.id}-${index}`}
    patrol={patrol}
    trackTimeEnvelope={trackTimeEnvelope}
    {...props}
  />);
};

export default memo(PatrolTracks);
