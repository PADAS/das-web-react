import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol } from '../utils/patrols';
import { openModalForPatrol } from '../utils/patrols';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';

import styles from './styles.module.scss';

const PatrolListItem = (props) => {
  const { map, patrol, onPatrolClick } = props;

  const onPatrolStatusClick = (e) => console.log('clicked status');

  const onPatrolTitleClick = (e) => {
    openModalForPatrol(patrol, map);
  };

  const patrolStatusStyle = `status-${patrol.state}`;

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>
    <h4 onClick={onPatrolTitleClick}>{patrol.title} <KebabMenuIcon className={styles.kebab} /></h4>
    <p>Time on patrol: <span>{displayDurationForPatrol(patrol)}</span></p>
    <p>Distance covered: <span>0km</span></p>
    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolListItem);