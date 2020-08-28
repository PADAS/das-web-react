import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import { calcPatrolStatusStyle } from '../utils/patrols';

import styles from './styles.module.scss';

const PatrolListItem = (props) => {
  const { patrol, onPatrolClick } = props;

  const onPatrolStatusClick = (e) => console.log('clicked status');
  const patrolStatusStyle = calcPatrolStatusStyle(patrol.state);

  return <div className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>
    <h4>{patrol.title}</h4>
    <p>Time on patrol: {patrol.elapsed_time}</p>
    <p>Distance covered: {patrol.distance}</p>
    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
  </div>;
};

export default memo(PatrolListItem);