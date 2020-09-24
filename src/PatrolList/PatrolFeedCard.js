import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import { displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';

import AddReport from '../AddReport';
import KebabMenuIcon from '../KebabMenuIcon';
import DasIcon from '../DasIcon';

import styles from './styles.module.scss';

const PatrolFeedCard = (props) => {
  const { patrol, onPatrolClick, onPatrolTitleClick } = props;

  const onPatrolStatusClick = (e) => console.log('clicked status');

  const patrolStatusStyle = `status-${patrol.state}`;
  const patrolIconId = iconTypeForPatrol(patrol);

  return <li className={`${styles.patrolListItem} ${styles[patrolStatusStyle]}`} onClick={onPatrolClick}>

    <div className={styles.textContainer}>
      {patrolIconId && <DasIcon type='events' onClick={()=>onPatrolTitleClick(patrol)} iconId={patrolIconId} />}
      <h4 onClick={()=>onPatrolTitleClick(patrol)}>{displayTitleForPatrol(patrol)}</h4>
      <KebabMenuIcon className={styles.kebab}/>
      <p>Time on patrol: <span>{displayDurationForPatrol(patrol)}</span></p>
      <p>Distance covered: <span>0km</span></p>
    </div>
    <Button type="button" onClick={onPatrolStatusClick} variant="link">{patrol.state}</Button>
    <AddReport className={styles.addReport} showLabel={false} />
  </li>;
};

export default memo(PatrolFeedCard);
