import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol, displayTitleForPatrol, openModalForPatrol, iconTypeForPatrol } from '../utils/patrols';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';
import DasIcon from '../DasIcon';

import styles from './styles.module.scss';

const PatrolListItem = (props) => {
  const { map, patrol, onPatrolClick } = props;

  const onPatrolStatusClick = (e) => console.log('clicked status');

  const onPatrolTitleClick = (e) => {
    openModalForPatrol(patrol, map);
  };

  const patrolStatusStyle = `status-${patrol.state}`;
  const patrolIconId = iconTypeForPatrol(patrol);

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>

    <div className={styles.textContainer}>
      {patrolIconId && <DasIcon type='events' onClick={onPatrolTitleClick} iconId={patrolIconId} />}
      <h4 onClick={onPatrolTitleClick}>{displayTitleForPatrol(patrol)}</h4>
      <KebabMenuIcon className={styles.kebab}/>
      <p>Time on patrol: <span>{displayDurationForPatrol(patrol)}</span></p>
      <p>Distance covered: <span>0km</span></p>
    </div>
    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolListItem);
