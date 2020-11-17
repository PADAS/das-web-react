import React, { memo, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getLeaderForPatrol } from '../utils/patrols';
import { fetchTracksIfNecessary, trimTrackDataToTimeRange } from '../utils/tracks';

import { withMap } from '../EarthRangerMap';
import TrackLayer from '../TracksLayer/track';

const linePaint = {
  'line-width': ['step', ['zoom'], 2, 8, ['+',['get', 'stroke-width'], 1]],
};

const PatrolTrackLayer = (props) => {
  const { map, patrol, showTrackTimepoints, trackLength, tracks } = props;

  const id = `patrol-${patrol.id}`;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);
  const leaderTrack = useMemo(() => leader && leader.id && tracks[leader.id], [leader, tracks]);

  const timeRange = useMemo(() => {
    const [firstLeg] = patrol.patrol_segments;

    return firstLeg && firstLeg.time_range;

  }, [patrol.patrol_segments]);
  
  const patrolTrackData = useMemo(() =>
    (leaderTrack && timeRange && timeRange.start_time)
      ?  trimTrackDataToTimeRange(leaderTrack, timeRange.start_time, timeRange.end_time)
      : null
  , [leaderTrack, timeRange]);

  const patrolTrackSourceData = useMemo(() => ({
    type: 'geojson',
    data: patrolTrackData && patrolTrackData,
  }), [patrolTrackData]);

  useEffect(() => {
    if (leader && leader.id) {
      fetchTracksIfNecessary([leader.id]);
    }
  }, [leader, trackLength]);

  if (!patrol || !patrolTrackData) return null;

  return <TrackLayer id={id} linePaint={linePaint} map={map} showTimepoints={showTrackTimepoints} trackData={patrolTrackData} />;
};

const mapStateToProps = ({ data: { tracks }, view: { showTrackTimepoints, trackLength } }) => ({ showTrackTimepoints, tracks });

export default connect(mapStateToProps, null)(
  withMap(
    memo(PatrolTrackLayer)
  )
);

PatrolTrackLayer.propTypes = {
  patrol: PropTypes.object,
};