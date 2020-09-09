import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol } from '../utils/patrols';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';

import styles from './styles.module.scss';

const PatrolListItem = (props) => {
  const { patrol, onPatrolClick } = props;

  const onPatrolStatusClick = (e) => console.log('clicked status');
  const patrolStatusStyle = `status-${patrol.state}`;

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>
    <h4>{patrol.title}</h4>
    <p>Time on patrol: {displayDurationForPatrol(patrol)}</p>
    <p>Distance covered: 0km</p>
    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
    <KebabMenuIcon className={styles.kebab} />
  </li>;
};

export default memo(PatrolListItem);