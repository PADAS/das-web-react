import React, { useCallback, useMemo, memo } from 'react';

import { calcPatrolCardState } from '../utils/patrols';

import { PATROL_CARD_STATES, PATROL_API_STATES } from '../constants';

import styles from './styles.module.scss';

const PatrolStartStopButton = (props) => {
  const { patrol, onPatrolChange } = props;

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

  const patrolStartStopTitle = useMemo(() => {
    if (canEndPatrol || patrolIsCancelled || patrolIsDone) return 'End Patrol';
    return 'Start Patrol';
  }, [canEndPatrol, patrolIsCancelled, patrolIsDone]);

  const isStop = patrolStartStopTitle === 'End Patrol';

  const togglePatrolStartStopState = useCallback(() => {
    if (canStartPatrol) {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.DONE, patrol_segments: [{ time_range: { end_time: new Date().toISOString() } }] });
    }
  }, [canStartPatrol, onPatrolChange]);

  return <button className={`${styles.startStopButton} ${isStop ? styles.stop : styles.start}`} type='button' onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</button>;
};

export default memo(PatrolStartStopButton);