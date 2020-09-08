import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import { calcPatrolStatusStyle, displayDurationForPatrol } from '../utils/patrols';

import styles from './styles.module.scss';

const PatrolListItem = (props) => {
  const { patrol, onPatrolClick } = props;

  const onPatrolStatusClick = (e) => console.log('clicked status');
  const patrolStatusStyle = calcPatrolStatusStyle(patrol.state);

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>
    <h4>{patrol.title}</h4>
    <p>Time on patrol: {displayDurationForPatrol(patrol)}</p>
    <p>Distance covered: 0km</p>
    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
  </li>;
};

export default memo(PatrolListItem);