import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import length from '@turf/length';

const PatrolDistanceCovered = (props) => {
  const { trackData } = props;

  const patrolTrackLength = useMemo(() => trackData ?
    length(trackData.track).toFixed(2) : 0
  , [trackData]);

  return `${patrolTrackLength}km`;
};

export default memo(PatrolDistanceCovered);

PatrolDistanceCovered.propTypes = {
  trackData: PropTypes.object,
};