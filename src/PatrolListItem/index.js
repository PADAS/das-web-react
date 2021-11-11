import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';

import { PATROL_API_STATES, PATROL_UI_STATES } from '../constants';

import { actualEndTimeForPatrol, actualStartTimeForPatrol, displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol,
  calcPatrolState, calcThemeColorForPatrolState, formatPatrolStateTitleDate, getBoundsForPatrol, displayStartTimeForPatrol, patrolHasGeoDataToDisplay, patrolStateDetailsEndTime, patrolStateDetailsStartTime, patrolStateDetailsOverdueStartTime } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { trackEvent } from '../utils/analytics';
import { createPatrolDataSelector } from '../selectors/patrols';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';

import DasIcon from '../DasIcon';
import FeedListItem from '../FeedListItem';
import LocationJumpButton from '../LocationJumpButton';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';
import PatrolMenu from './PatrolMenu';

import styles from './styles.module.scss';

const TRACK_FETCH_DEBOUNCE_DELAY = 150;
const STATE_CHANGE_POLLING_INTERVAL = 3000;

const PatrolListItem = (props, ref) => {
  const { showControls = true, map, patrolData, onPatrolChange, onSelfManagedStateChange, onTitleClick, dispatch: _dispatch, ...rest } = props;

  const { patrol, leader, trackData, startStopGeometries } = patrolData;

  const debouncedTrackFetch = useRef(null);
  const intervalRef = useRef(null);
  const menuRef = useRef(null);

  const [patrolState, setPatrolState] = useState(calcPatrolState(patrol));

  const isScheduledPatrol = patrolState === PATROL_UI_STATES.READY_TO_START
  || patrolState === PATROL_UI_STATES.SCHEDULED
  || patrolState === PATROL_UI_STATES.START_OVERDUE;

  const isPatrolDone = patrolState === PATROL_UI_STATES.DONE;
  const isPatrolActive = patrolState === PATROL_UI_STATES.ACTIVE;
  const isPatrolActiveOrDone = isPatrolActive || isPatrolDone;
  const isPatrolCancelled = patrolState === PATROL_UI_STATES.CANCELLED;
  const isPatrolOverdue = patrolState === PATROL_UI_STATES.START_OVERDUE;

  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);
  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);
  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
  const patrolElapsedTime = useMemo(() => !!patrolState && displayDurationForPatrol(patrol), [patrol, patrolState]);
  const scheduledStartTime = useMemo(() => patrolStateDetailsStartTime(patrol), [patrol]);
  const displayTitle = useMemo(() => displayTitleForPatrol(patrol, leader), [leader, patrol]);
  const themeColor = useMemo(() => calcThemeColorForPatrolState(patrolState), [patrolState]);
  const canShowTrack = useMemo(() => patrolHasGeoDataToDisplay(trackData, startStopGeometries), [startStopGeometries, trackData]);
  const patrolBounds = useMemo(() => getBoundsForPatrol(patrolData), [patrolData]);

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

  const patrolCancellationTime = useMemo(() => {
    if (!isPatrolCancelled) return null;

    const cancellation = patrol?.updates?.find(update => update.type === 'update_patrol_state' && update.message.includes('cancelled')) ?? null;
    if (!cancellation) return null;

    return formatPatrolStateTitleDate(new Date(cancellation.time));

  }, [isPatrolCancelled, patrol.updates]);

  const dateComponentDateString = useMemo(() => {
    if (isPatrolCancelled) return patrolCancellationTime;
    if (isPatrolDone) return patrolStateDetailsEndTime(patrol);
    if (isPatrolOverdue) return patrolStateDetailsOverdueStartTime(patrol);
    if (isPatrolActive || isScheduledPatrol) return formatPatrolStateTitleDate(displayStartTimeForPatrol(patrol));

    return null;

  }, [isPatrolActive, isPatrolCancelled, isPatrolDone, isPatrolOverdue, isScheduledPatrol, patrol, patrolCancellationTime]);

  const onLocationClick = useCallback(() => {
    trackEvent('Patrol Card', 'Click "jump to location" from patrol card popover');

    fitMapBoundsForAnalyzer(map, patrolBounds);
  }, [map, patrolBounds]);

  const restorePatrol = useCallback(() => {
    onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { end_time: null } }] });
  }, [onPatrolChange]);

  const startPatrol = useCallback(() => {
    onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
  }, [onPatrolChange]);

  const StateDependentControls = () => {
    if (isPatrolActiveOrDone) return <div className={styles.patrolTrackControls}>
      {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton patrolData={patrolData} showLabel={false} data-testid={`patrol-list-item-track-btn-${patrol.id}`} />}
      {!!patrolBounds && <LocationJumpButton onClick={onLocationClick} bypassLocationValidation={true} map={map} data-testid={`patrol-list-item-jump-btn-${patrol.id}`} />}
    </div>;
    if (isPatrolCancelled) return <Button variant='light' size='sm' onClick={restorePatrol} data-testid={`patrol-list-item-restore-btn-${patrol.id}`}>Restore</Button>;
    if (isScheduledPatrol) return  <Button variant='light' size='sm' onClick={startPatrol} data-testid={`patrol-list-item-start-btn-${patrol.id}`}>Start</Button>;
    return null;
  };

  useEffect(() => {
    if (leader && leader.id) {
      window.clearTimeout(debouncedTrackFetch.current);
      debouncedTrackFetch.current = setTimeout(() => {
        fetchTracksIfNecessary([leader.id], {
          optionalDateBoundaries: { since: actualStartTime, until: actualEndTime }
        });
      }, TRACK_FETCH_DEBOUNCE_DELAY);
      return () => window.clearTimeout(debouncedTrackFetch.current);
    }
  }, [actualEndTime, actualStartTime, leader]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const currentState = calcPatrolState(patrol);
      if (currentState !== patrolState) {
        setPatrolState(currentState);
        onSelfManagedStateChange && onSelfManagedStateChange(patrol);
      }
    }, STATE_CHANGE_POLLING_INTERVAL);

    return () => window.clearInterval(intervalRef.current);

  }, [onSelfManagedStateChange, patrol, patrolState]);

  useEffect(() => {
    setPatrolState(calcPatrolState(patrol));
  }, [patrol]);

  return <FeedListItem
    ref={ref}
    themeColor={themeColor}
    title={displayTitle}
    IconComponent={patrolIconId && <button onClick={() => onTitleClick(patrol)} data-testid={`patrol-list-item-icon-${patrol.id}`} className={styles.icon} type='button'>
      <DasIcon type='events' iconId={patrolIconId} />
    </button>}
    TitleComponent={
      <>
        <span className={styles.serialNumber}>{patrol.serial_number}</span>
        <button data-testid={`patrol-list-item-title-${patrol.id}`} title={displayTitle} className={styles.title} type='button' onClick={() => onTitleClick(patrol)}>
          <span className={styles.mainTitle}>{displayTitle}</span>
          {TitleDetailsComponent}
        </button>
      </>
    }
    DateComponent={
      <div className={styles.statusInfo} data-testid={`patrol-list-item-date-status-${patrol.id}`}>
        <strong data-testid={`patrol-list-item-state-title-${patrol.id}`}>{patrolState.title}</strong>
        <span>{dateComponentDateString}</span>
      </div>
    }
    ControlsComponent={
      showControls ? <>
        <StateDependentControls />
        <PatrolMenu data-testid={`patrol-list-item-kebab-menu-${patrol.id}`} patrol={patrol} menuRef={menuRef} onPatrolChange={onPatrolChange} />
      </> : null
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