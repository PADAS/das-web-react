import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import length from '@turf/length';

const PatrolDistanceCovered = (props) => {
  const { trackData } = props;

  console.log('my distance props', props);
  console.log('my length', !!trackData && length(trackData.track).toFixed(2));

  const patrolTrackLength = useMemo(() => trackData ?
    length(trackData.track).toFixed(2) : 0
  , [trackData]);

  return `${patrolTrackLength}km`;
};

export default memo(PatrolDistanceCovered);

PatrolDistanceCovered.propTypes = {
  tracks: PropTypes.object.isRequired,
  patrol: PropTypes.object.isRequired,
};