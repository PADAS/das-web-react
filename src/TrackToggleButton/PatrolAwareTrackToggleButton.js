import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';

import { getLeaderForPatrol } from '../utils/patrols';
import { togglePatrolTrackState } from '../ducks/patrols';
import { toggleTrackState } from '../ducks/map-ui';

import TrackToggleButton from './';


const PatrolAwareTrackToggleButton = (props) => {
  const { dispatch:_dispatch, patrol, patrolTrackState, subjectTrackState, togglePatrolTrackState, toggleTrackState, ...rest } = props;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);

  const patrolTrackPinned = useMemo(() => patrolTrackState.pinned.includes(patrol.id), [patrol.id, patrolTrackState.pinned]);
  const patrolTrackVisible = useMemo(() => !patrolTrackPinned && patrolTrackState.visible.includes(patrol.id), [patrol.id, patrolTrackPinned, patrolTrackState.visible]);
  const patrolTrackHidden = useMemo(() => !patrolTrackPinned && !patrolTrackVisible, [patrolTrackPinned, patrolTrackVisible]);

  const subjectTrackPinned = useMemo(() => !!leader && subjectTrackState.pinned.includes(leader.id), [leader, subjectTrackState.pinned]);
  const subjectTrackVisible = useMemo(() => !!leader && !subjectTrackPinned && subjectTrackState.visible.includes(leader.id), [leader, subjectTrackPinned, subjectTrackState.visible]);
  const subjectTrackHidden = useMemo(() => !subjectTrackPinned && !subjectTrackVisible, [subjectTrackPinned, subjectTrackVisible]);
  // trackVisible={patrolTrackVisible} trackPinned={patrolTrackPinned} onClick={onTrackButtonClick}

  const patrolToggleStates = useMemo(() => [patrolTrackPinned, patrolTrackVisible, patrolTrackHidden], [patrolTrackHidden, patrolTrackPinned, patrolTrackVisible]);
  const subjectToggleStates = useMemo(() => [subjectTrackPinned, subjectTrackVisible, subjectTrackHidden], [subjectTrackHidden, subjectTrackPinned, subjectTrackVisible]);

  const onTrackButtonClick = useCallback(() => {
    if (isEqual(patrolToggleStates, subjectToggleStates)) {
      toggleTrackState(leader.id);
      togglePatrolTrackState(patrol.id);
      return;
    }
    if (!patrolTrackHidden && subjectTrackHidden) {
      togglePatrolTrackState(patrol.id);
      return;
    }
    if (subjectTrackPinned && patrolTrackVisible) {
      togglePatrolTrackState(leader.id);
    }
    if (patrolTrackPinned && subjectTrackVisible) {
      toggleTrackState(leader.id);
    }
    if (patrolTrackHidden && !subjectTrackHidden) {
      toggleTrackState(leader.id);
      return;
    }
  }, [leader.id, patrol.id, patrolToggleStates, patrolTrackHidden, patrolTrackPinned, patrolTrackVisible, subjectToggleStates, subjectTrackHidden, subjectTrackPinned, subjectTrackVisible, togglePatrolTrackState, toggleTrackState]);

  

  return <TrackToggleButton disabled={!leader} trackVisible={patrolTrackVisible || subjectTrackVisible} trackPinned={patrolTrackPinned || subjectTrackPinned} onClick={onTrackButtonClick} {...rest} />;
};


const mapStateToProps = ({ view: { patrolTrackState, subjectTrackState } }) => ({ patrolTrackState, subjectTrackState });

export default connect(mapStateToProps, { togglePatrolTrackState, toggleTrackState })(memo(PatrolAwareTrackToggleButton));