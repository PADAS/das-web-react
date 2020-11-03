import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import length from '@turf/length';

import { getLeaderForPatrol } from '../utils/patrols';
import { trimTrackDataToTimeRange } from '../utils/tracks';


const PatrolDistanceCovered = (props) => {
  const { patrol, tracks } = props;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);
  const leaderTrack = useMemo(() => leader && leader.id && tracks[leader.id], [leader, tracks]);
  const timeRange = useMemo(() => {
    const [firstLeg] = patrol.patrol_segments;

    return firstLeg && firstLeg.time_range;

  }, [patrol.patrol_segments]);
  
  const patrolTrackData = useMemo(() =>
    (leaderTrack && timeRange && timeRange.start_time)
      ?  trimTrackDataToTimeRange(leaderTrack, timeRange.start_time, timeRange.end_time)
      : 0
  , [leaderTrack, timeRange]);

  const patrolTrackLength = useMemo(() => patrolTrackData ?
    length(patrolTrackData.track).toFixed(2) : 0
  , [patrolTrackData]);

  return `${patrolTrackLength}km`;
  
};

const mapStateToProps = ({ data: { tracks } }) => ({
  tracks,
});

export default connect(mapStateToProps, null)(memo(PatrolDistanceCovered));

PatrolDistanceCovered.propTypes = {
  tracks: PropTypes.object.isRequired,
  patrol: PropTypes.object.isRequired,
};