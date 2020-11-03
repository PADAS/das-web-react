import React, { memo, useEffect, useRef, useMemo, useCallback, useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol, displayStartTimeForPatrol,
  calcPatrolCardState, displayPatrolDoneTime, displayPatrolOverdueTime, getLeaderForPatrol } from '../utils/patrols';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';
import { fetchTracksIfNecessary } from '../utils/tracks';


import { PATROL_CARD_STATES } from '../constants';

import AddReport from '../AddReport';
import PatrolMenu from './PatrolMenu';
import DasIcon from '../DasIcon';
import Popover from './Popover';

import PatrolDistanceCovered from '../Patrols/DistanceCovered';


import styles from './styles.module.scss';

const PatrolCard = (props) => {
  const { patrol, onTitleClick, onPatrolChange } = props;

  const menuRef = useRef(null);
  const cardRef = useRef(null);
  const popoverRef = useRef(null);
  const stateTitleRef = useRef(null);

  const patrolState = useMemo(() => calcPatrolCardState(patrol), [patrol]);

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_CARD_STATES.CANCELLED
  , [patrolState]);

  const [popoverOpen, setPopoverState] = useState(false);

  const patrolStateTitle = useMemo(() => {
    if(patrolState === PATROL_CARD_STATES.DONE) {
      return patrolState.title + ' ' + displayPatrolDoneTime(patrol);
    } 
    if(patrolState === PATROL_CARD_STATES.START_OVERDUE) {
      return patrolState.title + ' ' + displayPatrolOverdueTime(patrol);
    }
    return patrolState.title;
  }, [patrol, patrolState]);

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);

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

  const subjectTitleForPatrol = useMemo(() => (leader && leader.name) || '', [leader]);

  const displayTitle = useMemo(() => { 
    return subjectTitleForPatrol || displayTitleForPatrol(patrol);
  }, [patrol, subjectTitleForPatrol]);

  const isScheduledPatrol = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.READY_TO_START 
    || patrolState === PATROL_CARD_STATES.START_OVERDUE;
  }, [patrolState]);

  const patrolStatusStyle = `status-${patrolState.status}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
 
  const hoverTitle = useMemo(() => {
    return patrol.serial_number + ' ' + displayTitle;
  }, [displayTitle, patrol]);

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


  return <li ref={cardRef} className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`}>
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
          <p>Distance covered: <span><PatrolDistanceCovered patrol={patrol} /></span></p>
        </div>
      </Fragment>}
    </div>
    <h6 ref={stateTitleRef} onClick={togglePopoverIfPossible}>{patrolStateTitle}</h6>
    <AddReport className={styles.addReport} showLabel={false} />
    <Popover isOpen={popoverOpen} container={cardRef}
      target={stateTitleRef} ref={popoverRef}
      onPatrolChange={onPatrolChange} patrol={patrol} />
  </li>;
};

export default memo(PatrolCard);

PatrolCard.propTypes = {
  patrol: PropTypes.object.isRequired,
  onTitleClick: PropTypes.func,
  onPatrolChange: PropTypes.func.isRequired,
};
