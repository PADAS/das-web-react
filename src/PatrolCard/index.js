import React, { forwardRef, memo, useEffect, useRef, useMemo, useCallback, useState, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { actualEndTimeForPatrol, actualStartTimeForPatrol, displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol,
  calcPatrolCardState, patrolStateDetailsEndTime, patrolStateDetailsStartTime, patrolStateDetailsOverdueStartTime } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { createPatrolDataSelector } from '../selectors/patrols';

import { trackEvent } from '../utils/analytics';

import { PATROL_STATES } from '../constants';

// import AddReport from '../AddReport';
import PatrolMenu from './PatrolMenu';
import DasIcon from '../DasIcon';
import Popover from './Popover';

import PatrolDistanceCovered from '../Patrols/DistanceCovered';


import styles from './styles.module.scss';

const PatrolCard = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { patrolData, subjectStore, onTitleClick, onPatrolChange, onSelfManagedStateChange, pickingLocationOnMap, dispatch: _dispatch, ...rest } = props;

  const { patrol, leader } = patrolData;

  const menuRef = useRef(null);
  const cardRef = useRef(ref || null);
  const popoverRef = useRef(null);
  const stateTitleRef = useRef(null);

  const intervalRef = useRef(null);

  const [patrolState, setPatrolState] = useState(calcPatrolCardState(patrol));

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_STATES.CANCELLED
  , [patrolState]);

  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);
  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);

  const [popoverOpen, setPopoverState] = useState(false);

  const onPopoverHide = useCallback(() => setPopoverState(false), []);

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

  const togglePopoverIfPossible = useCallback(() => {
    if (!patrolIsCancelled) {
      setPopoverState(!popoverOpen);
    }
  }, [patrolIsCancelled, popoverOpen]);

  const patrolElapsedTime = useMemo(() => !!patrolState && displayDurationForPatrol(patrol), [patrol, patrolState]);

  const scheduledStartTime = useMemo(() => {
    return patrolStateDetailsStartTime(patrol);
  }, [patrol]);

  const displayTitle = useMemo(() => displayTitleForPatrol(patrol, leader), [leader, patrol]);

  const isScheduledPatrol = patrolState === PATROL_STATES.READY_TO_START
    || patrolState === PATROL_STATES.SCHEDULED
    || patrolState === PATROL_STATES.START_OVERDUE;

  const isPatrolActiveOrDone = patrolState === PATROL_STATES.ACTIVE || patrolState === PATROL_STATES.DONE;

  const isCancelledPatrol = patrolState === PATROL_STATES.CANCELLED;

  const patrolStatusStyle = `status-${patrolState.status}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const hoverTitle = useMemo(() => {
    return patrol.serial_number + ' ' + displayTitle;
  }, [displayTitle, patrol]);

  const onPatrolChangeFromPopover = useCallback((...args) => {
    onPatrolChange(...args);
    setPopoverState(false);
  }, [onPatrolChange]);

  const hidePopover = useCallback((provenance) => {
    setPopoverState(false);
    trackEvent('Patrol Card', `Close patrol card popover${provenance ? ` (${provenance})` : ''}`);
  }, []);

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    if (key === 'Escape') {
      hidePopover('escape key');
    }
  }, [hidePopover]);

  const handleOutsideClick = useCallback((e) => {
    if (popoverRef.current
    && (!popoverRef.current.contains(e.target))
    && !pickingLocationOnMap) {
      setPopoverState(false);
      hidePopover('outside click');
    }
  }, [hidePopover, pickingLocationOnMap]);

  useEffect(() => {
    if (popoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, handleOutsideClick, hidePopover, popoverOpen]);

  useEffect(() => {
    if (patrolIsCancelled) {
      setPopoverState(false);
    }
  }, [patrolIsCancelled]);

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

  useEffect(() => {
    setPatrolState(calcPatrolCardState(patrol));
  }, [patrol]);

  useEffect(() => {
    if (!!popoverOpen) {
      trackEvent('Patrol Card', 'Open patrol card popover');
    }
  }, [popoverOpen]);


  return <li ref={cardRef} className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} {...rest}>
    {patrolIconId && <DasIcon type='events' onClick={onTitleClick} iconId={patrolIconId} />}
    <div className={styles.header}>
      <h3 onClick={onTitleClick} title={hoverTitle}>{displayTitle}</h3>
    </div>
    <PatrolMenu patrol={patrol} menuRef={menuRef} onPatrolChange={onPatrolChange} onClickOpen={onTitleClick} />
    <div className={styles.statusInfo} onClick={togglePopoverIfPossible}>
      {isScheduledPatrol && <Fragment>
        <p>Scheduled: <span>{scheduledStartTime}</span></p>
      </Fragment>}
      {isPatrolActiveOrDone && <Fragment>
        <p><span>{patrolElapsedTime}</span> | <span><PatrolDistanceCovered patrolsData={[patrolData]} suffix=' km' /></span></p>
      </Fragment>}
      {isCancelledPatrol && <Fragment>
        <p>No Patrol: <span>{scheduledStartTime}</span></p>
      </Fragment>}
    </div>
    <h6 ref={stateTitleRef} onClick={togglePopoverIfPossible}>{patrolStateTitle}</h6>
    <Popover isOpen={popoverOpen} container={cardRef} patrolState={patrolState}
      target={stateTitleRef} ref={popoverRef} onHide={onPopoverHide}
      onPatrolChange={onPatrolChangeFromPopover} patrolData={patrolData} />
  </li>;
});

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

export default connect(makeMapStateToProps, null)(memo(PatrolCard));

PatrolCard.propTypes = {
  patrol: PropTypes.object.isRequired,
  onTitleClick: PropTypes.func,
  onPatrolChange: PropTypes.func.isRequired,
};
