import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import FeedListItem from '../FeedListItem';

import { PATROL_CARD_STATES } from '../constants';

import { actualEndTimeForPatrol, actualStartTimeForPatrol, displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol,
  calcPatrolCardState, getBoundsForPatrol, patrolHasGeoDataToDisplay, patrolStateDetailsEndTime, patrolStateDetailsStartTime, patrolStateDetailsOverdueStartTime } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { trackEvent } from '../utils/analytics';
import { createPatrolDataSelector } from '../selectors/patrols';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';

import PatrolMenu from '../PatrolCard/PatrolMenu';
import DasIcon from '../DasIcon';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';


import styles from './styles.module.scss';

const PatrolListItem = (props, ref) => {
  const { map, patrolData, onPatrolChange, onSelfManagedStateChange, onTitleClick, dispatch, ...rest } = props;

  const menuRef = useRef(null);

  const { patrol, leader, trackData, startStopGeometries } = patrolData;
  const [patrolState, setPatrolState] = useState(calcPatrolCardState(patrol));

  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);
  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const leaderLastPositionCoordinates = useMemo(() => leader?.last_position?.geometry?.coordinates, [leader]);

  const patrolStateTitle = useMemo(() => {
    if (patrolState === PATROL_CARD_STATES.DONE) {
      return patrolState.title + ' ' + patrolStateDetailsEndTime(patrol);
    }
    if (patrolState === PATROL_CARD_STATES.START_OVERDUE) {
      return patrolState.title + ' ' + patrolStateDetailsOverdueStartTime(patrol);
    }
    return patrolState.title;
  }, [patrol, patrolState]);

  const debouncedTrackFetch = useRef(null);

  useEffect(() => {
    if (leader && leader.id) {
      window.clearTimeout(debouncedTrackFetch.current);
      debouncedTrackFetch.current = setTimeout(() => {
        fetchTracksIfNecessary([leader.id], {
          optionalDateBoundaries: { since: actualStartTime, until: actualEndTime }
        });
      }, 150);
      return () => window.clearTimeout(debouncedTrackFetch.current);
    }
  }, [actualEndTime, actualStartTime, leader]);


  const intervalRef = useRef(null);
  useEffect(() => {
    window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      const currentState = calcPatrolCardState(patrol);
      if (currentState !== patrolState) {
        setPatrolState(currentState);
        onSelfManagedStateChange(patrol);
      }
    }, 3000);

    return () => window.clearInterval(intervalRef.current);

  }, [onSelfManagedStateChange, patrol, patrolState]);

  const patrolElapsedTime = useMemo(() => !!patrolState && displayDurationForPatrol(patrol), [patrol, patrolState]);

  const scheduledStartTime = useMemo(() => {
    return patrolStateDetailsStartTime(patrol);
  }, [patrol]);

  const displayTitle = useMemo(() => displayTitleForPatrol(patrol, leader), [leader, patrol]);

  const isScheduledPatrol = patrolState === PATROL_CARD_STATES.READY_TO_START
  || patrolState === PATROL_CARD_STATES.SCHEDULED
  || patrolState === PATROL_CARD_STATES.START_OVERDUE;

  const isPatrolActiveOrDone = patrolState === PATROL_CARD_STATES.ACTIVE || patrolState === PATROL_CARD_STATES.DONE;

  const isCancelledPatrol = patrolState === PATROL_CARD_STATES.CANCELLED;

  const canShowTrack = useMemo(() => patrolHasGeoDataToDisplay(trackData, startStopGeometries), [startStopGeometries, trackData]);

  const patrolBounds = useMemo(() => getBoundsForPatrol(patrolData), [patrolData]);


  const onLocationClick = useCallback(() => {
    trackEvent('Patrol Card', 'Click "jump to location" from patrol card popover');

    fitMapBoundsForAnalyzer(map, patrolBounds);
  }, [map, patrolBounds]);


  useEffect(() => {
    setPatrolState(calcPatrolCardState(patrol));
  }, [patrol]);

  const canShowControls = useMemo(() =>
    !isScheduledPatrol &&
  (canShowTrack || !!patrolBounds)
  , [canShowTrack, isScheduledPatrol, patrolBounds]);

  return <FeedListItem
    ref={ref}
    IconComponent={patrolIconId && <button className={styles.icon} type='button'>
      <DasIcon type='events' onClick={onTitleClick} iconId={patrolIconId} />
    </button>}
    TitleComponent={
      <button type='button' onClick={onTitleClick}>{displayTitle}</button>
    }
    DateComponent={
      <div className={styles.statusInfo}>
        <strong>{patrolStateTitle}</strong>
        {isScheduledPatrol && <>
          <p>Scheduled: <span>{scheduledStartTime}</span></p>
        </>}
        {isPatrolActiveOrDone && <>
          <p><span>{patrolElapsedTime}</span> | <span><PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' /></span></p>
        </>}
        {isCancelledPatrol && <>
          <p>No Patrol: <span>{scheduledStartTime}</span></p>
        </>}
      </div>
    }
    ControlsComponent={<>
      {canShowControls && <div className={styles.controls}>
          {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton patrolData={patrolData} showLabel={false} />}
          {!!patrolBounds && <LocationJumpButton onClick={onLocationClick} bypassLocationValidation={true} coordinates={leaderLastPositionCoordinates} map={map} />}
        </div>}
      <PatrolMenu patrol={patrol} menuRef={menuRef} onPatrolChange={onPatrolChange} onClickOpen={onTitleClick} />
    </>
    }
  {...rest}
  />;
};


const makeMapStateToProps = () => {
  const getDataForPatrolFromProps = createPatrolDataSelector();
  const mapStateToProps = (state, props) => {
    return {
      patrolData: getDataForPatrolFromProps(state, props),
      pickingLocationOnMap: state?.view?.userPreferences?.pickingLocationOnMap,
    };
  };
  return mapStateToProps;
};

export default connect(makeMapStateToProps, null)(
  memo(
    forwardRef(PatrolListItem)
  )
);

/* 
return <Flipped flipId={patrol.id}>
    <PatrolCard
      ref={ref}
      onTitleClick={onTitleClick}
      onPatrolChange={onPatrolChange}
      onSelfManagedStateChange={onStateUpdateFromCard}
      patrol={patrol}
      map={map}
      {...rest} />
  </Flipped>;
*/