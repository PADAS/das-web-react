import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol, calcPatrolCardState } from '../utils/patrols';

import Dropdown from 'react-bootstrap/Dropdown';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';
import DasIcon from '../DasIcon';
import InlineEditable from '../InlineEditable';

import styles from './styles.module.scss';

const { Toggle, Menu, Item/* , Header, Divider */ } = Dropdown;


const PATROL_STATES = {
  OPEN: 'open',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

const PatrolCard = (props) => {
  const { patrol, onTitleClick, onTitleChange } = props;

  const [firstLeg] = patrol.patrol_segments;

  const { time_range: { start_time, end_time } } = firstLeg;

  

  const hasStarted = !!start_time && new Date(start_time).getTime() < new Date().getTime();
  const hasEnded = !!end_time && new Date(end_time).getTime() < new Date().getTime();

  const [editingTitle, setTitleEditState] = useState(false);
  const [showTitleHover, setShowTitleHover] = useState(false);
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
    return patrol.state === PATROL_STATES.CANCELLED;
  }, [patrol.state]);

  const canCancelPatrol = useMemo(() => {
    return patrol.state === PATROL_STATES.OPEN &&
    !hasEnded;
  }, [hasEnded, patrol.state]);

  const patrolStartEndCanBeToggled = useMemo(() => {
    return (patrol.state === PATROL_STATES.OPEN)
      && (canStartPatrol || canEndPatrol);
  }, [canEndPatrol, canStartPatrol, patrol.state]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    return (patrol.state !== PATROL_STATES.DONE)
    && (canRestorePatrol || canCancelPatrol);
  }, [canCancelPatrol, canRestorePatrol, patrol.state]);
  
  const patrolStartStopTitle = useMemo(() => {
    if (canEndPatrol) return 'End Patrol';
    return 'Start Patrol';
  }, [canEndPatrol]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return 'Restore Patrol';
    return 'Cancel Patrol';
  }, [canRestorePatrol]);

  const togglePatrolCancelationState = useCallback(() => {
    console.log('toggling patrol cancel/restore state');
  }, []);

  const togglePatrolStartStopState = useCallback(() => {
    console.log('toggling patrol start/stop state');
  }, []);

  const onPatrolTitleChange = useCallback((value) => {
    onTitleChange(value);
    endTitleEdit();
  }, [endTitleEdit, onTitleChange]);

  const patrolStatusStyle = `status-${patrolState.status}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
  const displayTitle = useMemo(() => displayTitleForPatrol(patrol), [patrol]);

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`}>
    {patrolIconId && <DasIcon type='events' /* onClick={()=>onTitleClick(patrol)} */ iconId={patrolIconId} />}
    <InlineEditable editing={editingTitle} value={displayTitle} onEsc={endTitleEdit}
      className={`${styles.title} ${editingTitle ? styles.editing : styles.notEditing}`}
      onCancel={endTitleEdit} onSave={onPatrolTitleChange} onClick={()=>onTitleClick(patrol)} 
      onMouseEnter={() => setShowTitleHover(true)} onMouseLeave={() => setShowTitleHover(false)}/>
    {/* {showTitleHover && <div>{patrol.title}</div>} */}
    <Dropdown alignRight className={styles.kebabMenu}>
      <Toggle as="button">
        <KebabMenuIcon />
      </Toggle>
      <Menu ref={menuRef}>
        <Item disabled={!patrolStartEndCanBeToggled} onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</Item>
        <Item onClick={()=>onTitleClick(patrol)}>Open</Item>
        <Item onClick={startTitleEdit}>Rename</Item>
        <Item disabled={!patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancelationState}>{patrolCancelRestoreTitle}</Item>
      </Menu>
    </Dropdown>
      
    <p>Time on patrol: <span>{displayDurationForPatrol(patrol)}</span></p>
    <p>Distance covered: <span>0km</span></p>

    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrolState.title}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolCard);
