import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol, 
  calcPatrolCardState, displayPatrolDoneTime, displayPatrolOverdueTime } from '../utils/patrols';

import Dropdown from 'react-bootstrap/Dropdown';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';
import DasIcon from '../DasIcon';
import InlineEditable from '../InlineEditable';

import styles from './styles.module.scss';
import { PATROL_STATE } from '../constants';

const { Toggle, Menu, Item/* , Header, Divider */ } = Dropdown;


const PATROL_STATES = {
  OPEN: 'open',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

const PatrolCard = (props) => {
  const { patrol, onTitleClick, onPatrolChange } = props;

  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time, end_time } } = firstLeg;

  const patrolIsCancelled = patrol.state === PATROL_STATES.CANCELLED;

  const hasStarted = !!start_time && new Date(start_time).getTime() < new Date().getTime();
  const hasEnded = !!end_time && new Date(end_time).getTime() < new Date().getTime();

  const [editingTitle, setTitleEditState] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (editingTitle && menuRef.current && !menuRef.current.contains(e.target)) {
        endTitleEdit();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);  /* eslint-disable-line react-hooks/exhaustive-deps */

  const startTitleEdit = useCallback(() => {
    setTitleEditState(true);
  }, []);

  const endTitleEdit = useCallback(() => {
    setTitleEditState(false);
  },[]);

  const onPatrolStatusClick = useCallback((e) => console.log('clicked status'), []);

  const canStartPatrol = useMemo(() =>
    patrol.state === PATROL_STATES.OPEN
    && !hasStarted
  , [hasStarted, patrol.state]);

  const canEndPatrol = useMemo(() =>
    patrol.state === PATROL_STATES.OPEN
      && hasStarted
      && !hasEnded
  , [hasEnded, hasStarted, patrol.state]);

  const patrolState = calcPatrolCardState(patrol);

  const canRestorePatrol = useMemo(() => {
    return patrol.state !== PATROL_STATES.OPEN
    || !!hasEnded;
  }, [hasEnded, patrol.state]);

  const canCancelPatrol = useMemo(() => {
    return patrol.state === PATROL_STATES.OPEN &&
    !hasEnded;
  }, [hasEnded, patrol.state]);

  const patrolStartEndCanBeToggled = useMemo(() => {
    return (patrol.state === PATROL_STATES.OPEN)
      && (canStartPatrol || canEndPatrol);
  }, [canEndPatrol, canStartPatrol, patrol.state]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    return canRestorePatrol || canCancelPatrol;
  }, [canCancelPatrol, canRestorePatrol]);
  
  const patrolStartStopTitle = useMemo(() => {
    if (canEndPatrol) return 'End';
    return 'Start';
  }, [canEndPatrol]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return 'Restore';
    return 'Cancel';
  }, [canRestorePatrol]);

  const patrolStateTitle = useMemo(() => {
    if(patrolState.status === PATROL_STATES.DONE) {
      return patrolState.title + ' ' + displayPatrolDoneTime(patrol);
    } 
    return patrolState.title;
  }, [patrol, patrolState]);

  const togglePatrolCancelationState = useCallback(() => {
    if (canRestorePatrol) {
      onPatrolChange({ state: PATROL_STATES.OPEN, patrol_segments: [{ time_range: { end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_STATES.CANCELLED });
    }
  }, [canRestorePatrol, onPatrolChange]);

  const togglePatrolStartStopState = useCallback(() => {
    if (canStartPatrol) {
      onPatrolChange({ state: PATROL_STATES.OPEN, patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }] });
    } else {
      onPatrolChange({ state: PATROL_STATES.DONE, patrol_segments: [{ time_range: { end_time: new Date().toISOString() } }] });
    }
  }, [canStartPatrol, onPatrolChange]);

  const onPatrolTitleChange = useCallback((value) => {
    onPatrolChange({ title: value });
    endTitleEdit();
  }, [endTitleEdit, onPatrolChange]);

  const patrolStatusStyle = `status-${patrolState.status}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
  const displayTitle = useMemo(() => displayTitleForPatrol(patrol), [patrol]);

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`}>
    {patrolIconId && <DasIcon type='events' /* onClick={()=>onTitleClick(patrol)} */ iconId={patrolIconId} />}
    <InlineEditable editing={editingTitle} value={displayTitle} onEsc={endTitleEdit}
      className={`${styles.title} ${editingTitle ? styles.editing : styles.notEditing}`}
      onCancel={endTitleEdit} onSave={onPatrolTitleChange} onClick={()=>onTitleClick(patrol)} 
      title={displayTitle} />
    <Dropdown alignRight className={styles.kebabMenu}>
      <Toggle as="button">
        <KebabMenuIcon />
      </Toggle>
      <Menu ref={menuRef}>
        <Item disabled={!patrolStartEndCanBeToggled || patrolIsCancelled} onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</Item>
        <Item disabled={patrolIsCancelled} onClick={()=>onTitleClick(patrol)}>Open</Item>
        <Item disabled={patrolIsCancelled} onClick={startTitleEdit}>Rename</Item>
        <Item disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancelationState}>{patrolCancelRestoreTitle}</Item>
      </Menu>
    </Dropdown>
      
    <p>Time on patrol: <span>{displayDurationForPatrol(patrol)}</span></p>
    <p>Distance covered: <span>0km</span></p>

    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrolStateTitle}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolCard);

PatrolCard.propTypes = {
  patrol: PropTypes.object.isRequired,
  onTitleClick: PropTypes.func,
  onPatrolChange: PropTypes.func.isRequired,
};
