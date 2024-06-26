import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { patrolStateAllowsTrackDisplay } from '../utils/patrols';

import length from '@turf/length';

const PatrolDistanceCovered = ({ patrolsData  = [], suffix='km' }) => {

  const patrolTrackLength = useMemo(() =>
    patrolsData
      .filter(({ patrol }) => !!patrolStateAllowsTrackDisplay(patrol))
      .reduce((accumulator, patrolData) => {
        const { trackData, startStopGeometries } = patrolData;

        const lineLength = startStopGeometries?.lines ? length(startStopGeometries.lines) : 0;
        const trackLength = trackData?.track ? length(trackData.track) : 0;

        return accumulator + lineLength + trackLength;

      }, 0),
  [patrolsData]);

  return `${patrolTrackLength ? patrolTrackLength.toFixed(2) : 0}${suffix}`;
};


export default memo(PatrolDistanceCovered);

PatrolDistanceCovered.propTypes = {
  trackData: PropTypes.object,
};