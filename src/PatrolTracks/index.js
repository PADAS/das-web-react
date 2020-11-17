import { React, memo } from 'react';

import PatrolTrackLayer from '../PatrolTrackLayer';

const PatrolTracks = (props) => {
  const { patrols } = props;

  return patrols.map(patrol => <PatrolTrackLayer key={patrol.id} patrol={patrol} />);

};

export default memo(PatrolTracks);