import { memo, useMemo } from 'react';
import { length } from '@turf/turf';

import { formatDistanceInKilometers } from '../utils/distance';
import { patrolStateAllowsTrackDisplay } from '../utils/patrols';

const PatrolDistanceCovered = ({ patrolsData = [] }) => {
  const patrolTrackLength = useMemo(() =>
    patrolsData
      .filter(({ patrol }) => !!patrolStateAllowsTrackDisplay(patrol))
      .reduce((accumulator, { trackData }) => {
        const trackLength = trackData ? length(trackData.track) : 0;

        return accumulator + trackLength;
      }, 0),
  [patrolsData]);

  return formatDistanceInKilometers(patrolTrackLength);
};

export default memo(PatrolDistanceCovered);
