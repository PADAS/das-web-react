import React, { forwardRef, memo, useEffect, useRef, useMemo, useCallback, useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol, displayStartTimeForPatrol,
  calcPatrolCardState, displayPatrolDoneTime, displayPatrolOverdueTime } from '../utils/patrols';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';
import { fetchTracksIfNecessary } from '../utils/tracks';


import { PATROL_CARD_STATES } from '../constants';

import AddReport from '../AddReport';
import PatrolMenu from './PatrolMenu';
import DasIcon from '../DasIcon';
import Popover from './Popover';

import PatrolDistanceCovered from '../Patrols/DistanceCovered';


import styles from './styles.module.scss';

const PatrolCard = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { patrolData, subjectStore, onTitleClick, onPatrolChange, onSelfManagedStateChange, dispatch:_dispatch, ...rest } = props;

  const { patrol, leader, trackData } = patrolData;

  const menuRef = useRef(null);
  const cardRef = useRef(ref || null);
  const popoverRef = useRef(null);
  const stateTitleRef = useRef(null);

  const intervalRef = useRef(null);

  const [patrolState, setPatrolState] = useState(calcPatrolCardState(patrol));

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_CARD_STATES.CANCELLED
  , [patrolState]);

  const [popoverOpen, setPopoverState] = useState(false);

  const onPopoverHide = useCallback(() => setPopoverState(false), []);

  const patrolStateTitle = useMemo(() => {
    if(patrolState === PATROL_CARD_STATES.DONE) {
      return patrolState.title + ' ' + displayPatrolDoneTime(patrol);
    } 
    if(patrolState === PATROL_CARD_STATES.START_OVERDUE) {
      return patrolState.title + ' ' + displayPatrolOverdueTime(patrol);
    }
    return patrolState.title;
  }, [patrol, patrolState]);

  useEffect(() => {
    if (leader && leader.id) {
      fetchTracksIfNecessary([leader.id]);
    }
  }, [leader]);

  const togglePopoverIfPossible = useCallback(() => {
    if (!patrolIsCancelled) {
      setPopoverState(!popoverOpen);
    }
  }, [patrolIsCancelled, popoverOpen]);

  const patrolElapsedTime = useMemo(() => displayDurationForPatrol(patrol), [patrol]);

  const scheduledStartTime = useMemo(() => {
    const startTime = displayStartTimeForPatrol(patrol);
    return format(startTime, STANDARD_DATE_FORMAT);
  }, [patrol]);

  const displayTitle = useMemo(() => displayTitleForPatrol(patrol, leader), [leader, patrol]);

  const isScheduledPatrol = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.READY_TO_START 
    || patrolState === PATROL_CARD_STATES.START_OVERDUE;
  }, [patrolState]);

  const patrolStatusStyle = `status-${patrolState.status}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
 
  const hoverTitle = useMemo(() => {
    return patrol.serial_number + ' ' + displayTitle;
  }, [displayTitle, patrol]);

  const onPatrolChangeFromPopover = useCallback((...args) => {
    onPatrolChange(...args);
    setPopoverState(false);
  }, [onPatrolChange]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      console.log('popoverRef', popoverRef);
      if (popoverRef.current && 
        (!popoverRef.current.contains(e.target))) {
        setPopoverState(false);
      }
    };
    setTimeout(() => {
      if (popoverOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
      } else {
        document.removeEventListener('mousedown', handleOutsideClick);
      }
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    });
  }, [popoverOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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


  return <li ref={cardRef} className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} {...rest}>
    {patrolIconId && <DasIcon type='events' onClick={onTitleClick} iconId={patrolIconId} />}
    <div className={styles.header}>
      <h3 onClick={onTitleClick} title={hoverTitle}>{displayTitle}</h3>
    </div>  
    <PatrolMenu patrol={patrol} menuRef={menuRef} onPatrolChange={onPatrolChange} onClickOpen={onTitleClick} />
    <div className={styles.statusInfo} onClick={togglePopoverIfPossible}>
      {isScheduledPatrol && <Fragment> 
        <p>Scheduled start: <span>{scheduledStartTime}</span></p>
      </Fragment>}
      {!isScheduledPatrol && <Fragment> 
        <div>
          <p>Time on patrol: <span>{patrolElapsedTime}</span></p>
          <p>Distance covered: <span><PatrolDistanceCovered trackData={trackData} /></span></p>
        </div>
      </Fragment>}
    </div>
    <h6 ref={stateTitleRef} onClick={togglePopoverIfPossible}>{patrolStateTitle}</h6>
    <AddReport className={styles.addReport} showLabel={false} />
    <Popover isOpen={popoverOpen} container={cardRef}
      target={stateTitleRef} ref={popoverRef} onHide={onPopoverHide}
      onPatrolChange={onPatrolChangeFromPopover} patrolData={patrolData} />
  </li>;
});

export default memo(PatrolCard);

PatrolCard.propTypes = {
  patrol: PropTypes.object.isRequired,
  onTitleClick: PropTypes.func,
  onPatrolChange: PropTypes.func.isRequired,
};
