import React, { memo, useRef, useMemo, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types'
import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol, displayStartTimeForPatrol,
  calcPatrolCardState, displayPatrolDoneTime, displayPatrolOverdueTime, getLeaderForPatrol } from '../utils/patrols';

import format from 'date-fns/format';

import AddReport from '../AddReport';
import PatrolMenu from './PatrolMenu';
import DasIcon from '../DasIcon';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';

import styles from './styles.module.scss';
import { PATROL_CARD_STATES } from '../constants';

const PatrolCard = (props) => {
  const { patrol, onTitleClick, onPatrolChange } = props;

  const menuRef = useRef(null);

  const onPatrolStatusClick = useCallback((e) => console.log('clicked status'), []);

  const patrolState = useMemo(() => calcPatrolCardState(patrol), [patrol]);

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

  const isScheduledPatrol = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.READY_TO_START 
    || patrolState === PATROL_CARD_STATES.START_OVERDUE;
  }, [patrolState]);

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
    <PatrolMenu patrol={patrol} patrolState={patrolState} menuRef={menuRef} onPatrolChange={onPatrolChange} onTitleClick={onTitleClick} />
    <div className={styles.statusInfo}>
      {isScheduledPatrol && <Fragment> 
        <p>Scheduled start: <span>{scheduledStartTime}</span></p>
      </Fragment>}
      {!isScheduledPatrol && <Fragment> 
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
