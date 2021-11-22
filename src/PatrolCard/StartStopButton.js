import React, { useCallback, useMemo, memo } from 'react';

import { calcPatrolCardState, canStartPatrol, canEndPatrol } from '../utils/patrols';

import { PATROL_CARD_STATES, PATROL_API_STATES } from '../constants';

import { trackEventFactory, PATROL_CARD_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';

const patrolCardTracker = trackEventFactory(PATROL_CARD_CATEGORY);

const PatrolStartStopButton = (props) => {
  const { patrol, onPatrolChange } = props;

  const patrolState = useMemo(() => calcPatrolCardState(patrol), [patrol]);

  const patrolIsDone = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.DONE;
  }, [patrolState]);

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_CARD_STATES.CANCELLED
  , [patrolState]);

  const canStart = useMemo(() => canStartPatrol(patrol), [patrol]);
  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

  const patrolStartStopTitle = useMemo(() => {
    if (canEnd || patrolIsCancelled || patrolIsDone) return 'End Patrol';
    return 'Start Patrol';
  }, [canEnd, patrolIsCancelled, patrolIsDone]);

  const isStop = patrolStartStopTitle === 'End Patrol';

  const togglePatrolStartStopState = useCallback(() => {
    patrolCardTracker.track(`${canStart ? 'Start' : 'End'} patrol from patrol card popover`);

    if (canEnd) {
      onPatrolChange({ state: PATROL_API_STATES.DONE, patrol_segments: [{ time_range: { end_time: new Date().toISOString() } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
    }
  }, [canEnd, canStart, onPatrolChange]);

  return <button className={`${styles.startStopButton} ${isStop ? styles.stop : styles.start}`} type='button' onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</button>;
};

export default memo(PatrolStartStopButton);