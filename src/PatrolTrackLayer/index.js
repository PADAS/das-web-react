import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getLeaderForPatrol } from '../utils/patrols';
import { visibleTrackDataWithPatrolAwareness } from '../selectors/patrols';
import { fetchTracksIfNecessary, trimTrackDataToTimeRange } from '../utils/tracks';

import { withMap } from '../EarthRangerMap';
import TrackLayer from '../TracksLayer/track';

const linePaint = {
  'line-width': ['step', ['zoom'], 2, 8, ['+',['get', 'stroke-width'], 1.5]],
  'line-offset': -0.75,
  'line-opacity': 1,
};

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const PatrolTrackLayer = (props) => {
  const { map, patrol, showTrackTimepoints, trackLength, tracks, dispatch:_dispatch, onPointClick, ...rest } = props;

  const id = `patrol-${patrol.id}`;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);
  const leaderTrack = useMemo(() => leader && leader.id && tracks.find(t => t.track.features[0].properties.id), [leader, tracks]);

  const onTimepointClick = useCallback((e) => {
    const layer = getPointLayer(e, map);
    onPointClick(layer);
  }, [map, onPointClick]);

  const timeRange = useMemo(() => {
    const [firstLeg] = patrol.patrol_segments;

    return firstLeg && firstLeg.time_range;

  }, [patrol.patrol_segments]);
  
  const patrolTrackData = useMemo(() =>
    (leaderTrack && timeRange && timeRange.start_time)
      ?  trimTrackDataToTimeRange(leaderTrack, timeRange.start_time, timeRange.end_time, true)
      : null
  , [leaderTrack, timeRange]);

  useEffect(() => {
    if (leader && leader.id) {
      fetchTracksIfNecessary([leader.id]);
    }
  }, [leader, trackLength, timeRange]);

  if (!patrol || !patrolTrackData) return null;

  console.log('patrolTrackData', patrolTrackData);

  return <TrackLayer key={id} id={id} linePaint={linePaint} map={map} showTimepoints={showTrackTimepoints} onPointClick={onTimepointClick} trackData={patrolTrackData} {...rest} />;
};

const mapStateToProps = (state) => {
  const { view: { showTrackTimepoints, trackLength } } = state;
  return {
    tracks: visibleTrackDataWithPatrolAwareness(state),
    trackLength: trackLength,
    showTrackTimepoints: showTrackTimepoints,
  };
};

export default connect(mapStateToProps, null)(
  withMap(
    memo(PatrolTrackLayer)
  )
);

PatrolTrackLayer.propTypes = {
  patrol: PropTypes.object,
};