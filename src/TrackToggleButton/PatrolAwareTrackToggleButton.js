import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';

import { PATROL_LIST_ITEM_CATEGORY, trackEventFactory } from '../utils/analytics';
import { togglePatrolTrackState } from '../ducks/patrols';
import { toggleTrackState } from '../ducks/map-ui';

import TrackToggleButton from './';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const PatrolAwareTrackToggleButton = ({ buttonRef, patrolData, ...restProps }) => {
  const dispatch = useDispatch();

  const patrolTrackState = useSelector((state) => state.view.patrolTrackState);
  const subjectTrackState = useSelector((state) => state.view.subjectTrackState);

  const { patrol, leader } = patrolData;

  const patrolTrackPinned = patrolTrackState.pinned.includes(patrol.id);
  const patrolTrackVisible = !patrolTrackPinned && patrolTrackState.visible.includes(patrol.id);
  const patrolTrackHidden = !patrolTrackPinned && !patrolTrackVisible;

  const subjectTrackPinned = !!leader && subjectTrackState.pinned.includes(leader.id);
  const subjectTrackVisible = !!leader && !subjectTrackPinned && subjectTrackState.visible.includes(leader.id);
  const subjectTrackHidden = !subjectTrackPinned && !subjectTrackVisible;

  const onTrackButtonClick = useCallback((event) => {
    event.stopPropagation();

    const nextPatrolTrackStateIfToggled = patrolTrackPinned
      ? 'hidden'
      : patrolTrackHidden ? 'visible' : 'pinned';

    if (!leader) {
      return;
    }

    const actionToTrack = `Toggle patrol track state to ${nextPatrolTrackStateIfToggled} from patrol card popover`;
    const patrolToggleStates = [patrolTrackPinned, patrolTrackVisible, patrolTrackHidden];
    const subjectToggleStates = [subjectTrackPinned, subjectTrackVisible, subjectTrackHidden];

    if (isEqual(patrolToggleStates, subjectToggleStates)) {
      dispatch(toggleTrackState(leader.id));
      dispatch(togglePatrolTrackState(patrol.id));
      patrolListItemTracker.track(actionToTrack);
      return;
    }

    if (!patrolTrackHidden && subjectTrackHidden) {
      dispatch(togglePatrolTrackState(patrol.id));
      patrolListItemTracker.track(actionToTrack);
      return;
    }

    if (subjectTrackPinned && patrolTrackVisible) {
      dispatch(togglePatrolTrackState(patrol.id));
      patrolListItemTracker.track(actionToTrack);
    }

    if (patrolTrackPinned && subjectTrackVisible) {
      dispatch(toggleTrackState(leader.id));
    }

    if (patrolTrackHidden && !subjectTrackHidden) {
      dispatch(toggleTrackState(leader.id));
      return;
    }
  }, [
    dispatch,
    leader,
    patrol.id,
    patrolTrackHidden,
    patrolTrackPinned,
    patrolTrackVisible,
    subjectTrackHidden,
    subjectTrackPinned,
    subjectTrackVisible,
  ]);

  return <TrackToggleButton
    disabled={!leader}
    onClick={onTrackButtonClick}
    ref={buttonRef}
    showTransparentIcon
    trackPinned={patrolTrackPinned && subjectTrackPinned}
    trackVisible={patrolTrackVisible}
    {...restProps}
  />;
};

export default memo(PatrolAwareTrackToggleButton);
