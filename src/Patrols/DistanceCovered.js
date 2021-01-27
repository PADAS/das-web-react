import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import length from '@turf/length';

const PatrolDistanceCovered = ({ patrolsData  = []}) => {
  const patrolTrackLength = useMemo(() =>
    patrolsData.reduce((accumulator, patrolData) => {
      const { trackData, startStopGeometries } = patrolData;

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