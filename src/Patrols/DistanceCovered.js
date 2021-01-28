import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { patrolShouldBeMeasured } from '../utils/patrols';

import length from '@turf/length';

const PatrolDistanceCovered = ({ patrolsData  = []}) => {
  
  const patrolTrackLength = useMemo(() =>
    patrolsData
      .filter(({ patrol }) => !!patrolShouldBeMeasured(patrol))
      .reduce((accumulator, patrolData) => {
        const { trackData, patrol, startStopGeometries } = patrolData;

        if (!patrolShouldBeMeasured(patrol)) {
          return 0;
        }

        const lineLength = startStopGeometries?.lines ? length(startStopGeometries.lines) : 0;
        const trackLength = trackData?.track ? length(trackData.track) : 0;

        return accumulator + lineLength + trackLength;

      }, 0), 
  [patrolsData]);

  return `${patrolTrackLength ? patrolTrackLength.toFixed(2) : 0}km`;
};


export default memo(PatrolDistanceCovered);

PatrolDistanceCovered.propTypes = {
  tracks: PropTypes.object.isRequired,
  patrol: PropTypes.object.isRequired,
};