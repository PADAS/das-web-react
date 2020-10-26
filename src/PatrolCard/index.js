import React, { memo, useRef, useMemo, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types'
import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol, displayStartTimeForPatrol,
  calcPatrolCardState, displayPatrolDoneTime, displayPatrolOverdueTime, getLeaderForPatrol } from '../utils/patrols';

import Dropdown from 'react-bootstrap/Dropdown';
import format from 'date-fns/format';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';
import DasIcon from '../DasIcon';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';

import styles from './styles.module.scss';
import { PATROL_CARD_STATES } from '../constants';

const { Toggle, Menu, Item/* , Header, Divider */ } = Dropdown;

const PATROL_API_STATES = {
  OPEN: 'open',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

const PatrolCard = (props) => {
  const { patrol, onTitleClick, onPatrolChange } = props;

  const menuRef = useRef(null);

  const onPatrolStatusClick = useCallback((e) => console.log('clicked status'), []);

  const patrolState = useMemo(() => calcPatrolCardState(patrol), [patrol]);

  const patrolIsDone = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.DONE;
  }, [patrolState]);

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_CARD_STATES.CANCELLED
  , [patrolState]);

  const canStartPatrol = useMemo(() => {
    return (patrolState === PATROL_CARD_STATES.READY_TO_START
      || patrolState === PATROL_CARD_STATES.START_OVERDUE);
  } , [patrolState]);

  const canEndPatrol = useMemo(() =>
    patrolState === PATROL_CARD_STATES.ACTIVE
  , [patrolState]);

  const canRestorePatrol = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.DONE 
    || patrolState === PATROL_CARD_STATES.CANCELLED;
  }, [patrolState]);

  const canCancelPatrol = useMemo(() => {
    return !(patrolState === PATROL_CARD_STATES.DONE
      || patrolState === PATROL_CARD_STATES.CANCELLED);
  }, [patrolState]);

  const patrolStartEndCanBeToggled = useMemo(() => {
    return (patrolState === PATROL_CARD_STATES.ACTIVE
      || patrolState === PATROL_CARD_STATES.READY_TO_START
      || patrolState === PATROL_CARD_STATES.START_OVERDUE);
  }, [patrolState]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    return canRestorePatrol || canCancelPatrol;
  }, [canCancelPatrol, canRestorePatrol]);
  
  const patrolStartStopTitle = useMemo(() => {
    if (canEndPatrol || patrolIsCancelled || patrolIsDone) return 'End Patrol';
    return 'Start Patrol';
  }, [canEndPatrol, patrolIsCancelled, patrolIsDone]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return 'Restore Patrol';
    return 'Cancel Patrol';
  }, [canRestorePatrol]);

  const patrolStateTitle = useMemo(() => {
    if(patrolState === PATROL_CARD_STATES.DONE) {
      return patrolState.title + ' ' + displayPatrolDoneTime(patrol);
    } 
    if(patrolState === PATROL_CARD_STATES.START_OVERDUE) {
      return patrolState.title + ' ' + displayPatrolOverdueTime(patrol);
    }
    return patrolState.title;
  }, [patrol, patrolState]);

  const patrolElapsedTime = useMemo(() => {
    if(patrolState === PATROL_CARD_STATES.READY_TO_START
      || patrolState === PATROL_CARD_STATES.START_OVERDUE) {
      return '0:00';
    } 
    return displayDurationForPatrol(patrol);
  }, [patrol, patrolState]);

  const togglePatrolCancelationState = useCallback(() => {
    if (canRestorePatrol) {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.CANCELLED });
    }
  }, [canRestorePatrol, onPatrolChange]);

  const togglePatrolStartStopState = useCallback(() => {
    if (canStartPatrol) {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.DONE, patrol_segments: [{ time_range: { end_time: new Date().toISOString() } }] });
    }
  }, [canStartPatrol, onPatrolChange]);

  const scheduledStartTime = useMemo(() => {
    const startTime = displayStartTimeForPatrol(patrol);
    return format(startTime, STANDARD_DATE_FORMAT);
  }, [patrol]);

  const subjectTitleForPatrol = useMemo(() => {
    const leader = getLeaderForPatrol(patrol);
    return (leader && leader.name) || '' ;
  }, [patrol]);

  const displayTitle = useMemo(() => { 
    return subjectTitleForPatrol || displayTitleForPatrol(patrol);
  }, [patrol, subjectTitleForPatrol]);

  const patrolStatusStyle = `status-${patrolState.status}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
 
  const hoverTitle = useMemo(() => {
    return patrol.serial_number + ' ' + displayTitle;
  }, [displayTitle, patrol]);


  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`}>
    {patrolIconId && <DasIcon type='events' onClick={()=>onTitleClick(patrol)} iconId={patrolIconId} />}
    <div className={styles.header}>
      <h3 onClick={()=>onTitleClick(patrol)}title={hoverTitle}>{displayTitle}</h3>
    </div>  
    <Dropdown alignRight className={styles.kebabMenu}>
      <Toggle as="button">
        <KebabMenuIcon />
      </Toggle>
      <Menu ref={menuRef}>
        <Item disabled={!patrolStartEndCanBeToggled || patrolIsCancelled} onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</Item>
        <Item disabled={patrolIsCancelled} onClick={()=>onTitleClick(patrol)}>Open Patrol</Item>
        <Item disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancelationState}>{patrolCancelRestoreTitle}</Item>
      </Menu>
    </Dropdown>
    <div className={styles.statusInfo}>
      {canStartPatrol && <Fragment> 
        <p>Scheduled start: <span>{scheduledStartTime}</span></p>
      </Fragment>}
      {!canStartPatrol && <Fragment> 
        <div>
          <p>Time on patrol: <span>{patrolElapsedTime}</span></p>
          <p>Distance covered: <span>0km</span></p>
        </div>
      </Fragment>}
    </div>
    <h6 onClick={onPatrolStatusClick}>{patrolStateTitle}</h6>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolCard);

PatrolCard.propTypes = {
  patrol: PropTypes.object.isRequired,
  onTitleClick: PropTypes.func,
  onPatrolChange: PropTypes.func.isRequired,
};
