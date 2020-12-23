import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

import Dropdown from 'react-bootstrap/Dropdown';

import KebabMenuIcon from '../KebabMenuIcon';
import styles from './styles.module.scss';
import { PATROL_CARD_STATES, PATROL_API_STATES } from '../constants';

import { canStartPatrol, canEndPatrol, calcPatrolCardState } from '../utils/patrols';

const { Toggle, Menu, Item/* , Header, Divider */ } = Dropdown;

const PatrolMenu = (props) => {
  const { patrol, onPatrolChange, onClickOpen, menuRef } = props;

  const patrolState = calcPatrolCardState(patrol);

  const patrolIsDone = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.DONE;
  }, [patrolState]);

  const patrolIsCancelled = useMemo(() =>
    patrolState === PATROL_CARD_STATES.CANCELLED
  , [patrolState]);

  const canStart = useMemo(() => canStartPatrol(patrol), [patrol]);
  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

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
      || patrolState === PATROL_CARD_STATES.SCHEDULED
      || patrolState === PATROL_CARD_STATES.START_OVERDUE);
  }, [patrolState]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    return canRestorePatrol || canCancelPatrol;
  }, [canCancelPatrol, canRestorePatrol]);
  
  const patrolStartStopTitle = useMemo(() => {
    if (canEnd || patrolIsCancelled || patrolIsDone) return 'End Patrol';
    return 'Start Patrol';
  }, [canEnd, patrolIsCancelled, patrolIsDone]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return 'Restore Patrol';
    return 'Cancel Patrol';
  }, [canRestorePatrol]);

  const togglePatrolCancelationState = useCallback(() => {
    if (canRestorePatrol) {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.CANCELLED });
    }
  }, [canRestorePatrol, onPatrolChange]);

  const togglePatrolStartStopState = useCallback(() => {
    if (canStart) {
      onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_API_STATES.DONE, patrol_segments: [{ time_range: { end_time: new Date().toISOString() } }] });
    }
  }, [canStart, onPatrolChange]);

  return  <Dropdown alignRight className={styles.kebabMenu}>
    <Toggle as="button">
      <KebabMenuIcon />
    </Toggle>
    <Menu ref={menuRef}>
      <Item disabled={!patrolStartEndCanBeToggled || patrolIsCancelled} onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</Item>
      <Item disabled={patrolIsCancelled} onClick={()=>onClickOpen(patrol)}>Open Patrol</Item>
      <Item disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancelationState}>{patrolCancelRestoreTitle}</Item>
    </Menu>
  </Dropdown>;
};

export default memo(PatrolMenu);

PatrolMenu.propTypes = {
  patrol: PropTypes.object.isRequired,
  patrolState: PropTypes.object.isRequired,
  onPatrolChange: PropTypes.func.isRequired,
};