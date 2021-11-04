import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';



import { PATROL_STATES } from '../constants';

import { actualEndTimeForPatrol, actualStartTimeForPatrol, displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol,
  calcPatrolCardState, calcThemeColorForPatrolListItem, formatPatrolCardStateTitleDate, getBoundsForPatrol, displayStartTimeForPatrol, patrolHasGeoDataToDisplay, patrolStateDetailsEndTime, patrolStateDetailsStartTime, patrolStateDetailsOverdueStartTime } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { trackEvent } from '../utils/analytics';
import { createPatrolDataSelector } from '../selectors/patrols';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';

import DasIcon from '../DasIcon';
import FeedListItem from '../FeedListItem';
import LocationJumpButton from '../LocationJumpButton';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';
import PatrolMenu from '../PatrolCard/PatrolMenu';

import styles from './styles.module.scss';
import { nullLiteral } from '@babel/types';

const PatrolListItem = (props, ref) => {
  const { map, patrolData, onPatrolChange, onSelfManagedStateChange, onTitleClick, dispatch, ...rest } = props;

  const menuRef = useRef(null);

  const { patrol, leader, trackData, startStopGeometries } = patrolData;
  const [patrolState, setPatrolState] = useState(calcPatrolCardState(patrol));

  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);
  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const patrolStateTitle = useMemo(() => {
    if (patrolState === PATROL_STATES.DONE) {
      return patrolState.title + ' ' + patrolStateDetailsEndTime(patrol);
    }
    if (patrolState === PATROL_STATES.START_OVERDUE) {
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

  const themeColor = useMemo(() => calcThemeColorForPatrolListItem(patrol), [patrol]);

  const isScheduledPatrol = patrolState === PATROL_STATES.READY_TO_START
  || patrolState === PATROL_STATES.SCHEDULED
  || patrolState === PATROL_STATES.START_OVERDUE;

  const isPatrolDone = patrolState === PATROL_STATES.DONE;
  const isPatrolActive = patrolState === PATROL_STATES.ACTIVE;
  const isPatrolActiveOrDone = isPatrolActive || isPatrolDone;
  const isPatrolCancelled = patrolState === PATROL_STATES.CANCELLED;
  const isPatrolOverdue = patrolState === PATROL_STATES.START_OVERDUE;

  const patrolCancellationTime = useMemo(() => {
    if (!isPatrolCancelled) return null;

    const cancellation = patrol.updates.find(update => update.type === 'update_patrol_state' && update.message.includes('cancelled'));
    if (!cancellation) return null;

    return formatPatrolCardStateTitleDate(new Date(cancellation.time));

  }, [isPatrolCancelled, patrol.updates]);

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


  const TitleDetailsComponent = useMemo(() => {
    if (isPatrolActiveOrDone) {
      return <span className={styles.titleDetails}>
        <span>{patrolElapsedTime}</span> | <span><PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' /></span>
      </span>;
    }
    if (isScheduledPatrol || isPatrolCancelled) {
      return <span className={styles.titleDetails}>
        Scheduled: <span>{scheduledStartTime}</span>
      </span>;
    }
    return null;
  }, [isPatrolCancelled, isPatrolActiveOrDone, isScheduledPatrol, patrolData, patrolElapsedTime, scheduledStartTime]);

  /*   if (patrolState === PATROL_STATES.DONE) {
    return patrolStateDetailsEndTime(patrol);
  }

  return displayStartTimeForPatrol(patrol); */

  const dateComponentDateString = useMemo(() => {
    if (isPatrolCancelled) return patrolCancellationTime;
    if (isPatrolDone) return patrolStateDetailsEndTime(patrol);
    if (isPatrolOverdue) return patrolStateDetailsOverdueStartTime(patrol);
    if (isPatrolActive || isScheduledPatrol) return formatPatrolCardStateTitleDate(displayStartTimeForPatrol(patrol));

    return null;

  }, [isPatrolActive, isPatrolCancelled, isPatrolDone, isPatrolOverdue, isScheduledPatrol, patrol, patrolCancellationTime]);

  return <FeedListItem
    ref={ref}
    themeColor={themeColor}
    IconComponent={patrolIconId && <button className={styles.icon} type='button'>
      <DasIcon type='events' onClick={onTitleClick} iconId={patrolIconId} />
    </button>}
    TitleComponent={
      <>
        <span className={styles.serialNumber}>{patrol.serial_number}</span>
        <button className={styles.title} type='button' onClick={onTitleClick}>
          <span className={styles.mainTitle}>{displayTitle}</span>
          {TitleDetailsComponent}
        </button>
      </>
    }
    DateComponent={
      <div className={styles.statusInfo}>
        <strong>{patrolState.title}</strong>
        <span>{dateComponentDateString}</span>
      </div>
    }
    ControlsComponent={<>
      {canShowControls && <>
          {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton patrolData={patrolData} showLabel={false} />}
          {!!patrolBounds && <LocationJumpButton onClick={onLocationClick} bypassLocationValidation={true} map={map} />}
        </>}
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