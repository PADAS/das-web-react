import React, { memo, useState, useMemo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';

import Dropdown from 'react-bootstrap/Dropdown';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';
import DasIcon from '../DasIcon';
import InlineEditable from '../InlineEditable';

import styles from './styles.module.scss';

const { Toggle, Menu, Item/* , Header, Divider */ } = Dropdown;


const PATROL_STATES = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  DONE: 'done',
  CANCELLED: 'cancelled',
  PAST: 'past',
};

const PatrolCard = (props) => {
  const { patrol, onPatrolClick, onPatrolTitleClick } = props;

  const [editingTitle, setTitleEditState] = useState(false);

  const startTitleEdit = useCallback(() => {
    setTitleEditState(true);
  }, []);

  const endTitleEdit = useCallback(() => {
    setTitleEditState(false);
  },[]);

  const onPatrolStatusClick = (e) => console.log('clicked status');

  const patrolStartEndCanBeToggled = useMemo(() => {
    const disqualifyingStates = ['cancelled', 'done', 'past'];
    return !disqualifyingStates.includes(patrol.state);
  }, [patrol.state]);

  const patrolCancelRestoreCanBeToggled = useMemo(() => {
    const disqualifyingStates = ['done', 'past'];
    return !!disqualifyingStates.includes(patrol.state);
  }, [patrol.state]);
  
  const canRestorePatrol = useMemo(() => {
    const qualifyingStates = ['cancelled'];
    return qualifyingStates.includes(patrol.state);
  }, [patrol.state]);

  const canStartPatrol = useMemo(() => {
    const qualifyingStates = ['upcoming', undefined, null];
    return qualifyingStates.includes(patrol.state);
  }, [patrol.state]);

  const canEndPatrol = useMemo(() => patrol.state === 'active', [patrol.state]);

  const patrolStartStopTitle = useMemo(() => {
    if (canEndPatrol) return 'End Patrol';
    return 'Start Patrol';
  }, [canEndPatrol]);

  const patrolCancelRestoreTitle = useMemo(() => {
    if (canRestorePatrol) return 'Restore Patrol';
    return 'Cancel Patrol';
  }, [canRestorePatrol]);

  const togglePatrolCancelationState = useCallback(() => {

  }, []);

  const togglePatrolStartStopState = useCallback(() => {

  }, []);

  const openPatrol = useCallback(() => {
    console.log('opening the patrol');
  }, []);

  const onPatrolTitleChange = useCallback((value) => {
    console.log('change the title to this', value);
    endTitleEdit();
  }, [endTitleEdit]);

  const patrolStatusStyle = `status-${patrol.state}`;

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
  const displayTitle = useMemo(() => displayTitleForPatrol(patrol), [patrol]);

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>

    
    {patrolIconId && <DasIcon type='events' onClick={()=>onPatrolTitleClick(patrol)} iconId={patrolIconId} />}
    <InlineEditable editing={editingTitle} value={displayTitle} onEsc={endTitleEdit}
      className={`${styles.title} ${editingTitle ? styles.editing : styles.notEditing}`}
      onCancel={endTitleEdit} onSave={onPatrolTitleChange} />
    <Dropdown alignRight onToggle={(e) => console.log('toggle')} className={styles.kebabMenu}>
      <Toggle as="button">
        <KebabMenuIcon />
      </Toggle>
      <Menu>
        <Item disabled={!patrolStartEndCanBeToggled} onClick={togglePatrolStartStopState}>{patrolStartStopTitle}</Item>
        <Item onClick={openPatrol}>Open</Item>
        <Item onClick={startTitleEdit}>Rename</Item>
        <Item disabled={patrolCancelRestoreCanBeToggled} onClick={togglePatrolCancelationState}>{patrolCancelRestoreTitle}</Item>
      </Menu>
    </Dropdown>
      
    <p>Time on patrol: <span>{displayDurationForPatrol(patrol)}</span></p>
    <p>Distance covered: <span>0km</span></p>

    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolCard);
