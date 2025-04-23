import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolsWithTracks } from '../selectors/patrols';

import StartStopLayer from './layer';

const PatrolStartStopLayer = () => {
  const patrolsWithTracks = useSelector(selectPatrolsWithTracks);

  return patrolsWithTracks.map((patrol, index) => <StartStopLayer key={index} patrol={patrol} />);
};

export default memo(PatrolStartStopLayer);
