import React, { memo, useEffect, useState, useRef } from 'react';
import { withFormDataContext } from '../EditableItem/context';

import { ReactComponent as Chevron } from '../common/images/icons/triple-chevron.svg';

import styles from './styles.module.scss';


const calcPatrolSegmentStatus = (patrol) => {
  const { patrol_segments } = patrol;

  if (!patrol_segments.length) return 'unknown';

  const [firstLeg]  = patrol_segments;

  // const { start_time, end_time, scheduled_start } = patrol;
  if (isCanceled(patrol))return 'canceled';
  if (isFinished(firstLeg)) return 'completed';
  if (isOverdue(firstLeg)) return 'overdue';
  if (isPending(firstLeg)) return 'pending';
  if (isActive(firstLeg)) return 'active';

  return 'unknown';
};

const isCanceled = (patrol) => patrol.state === 'canceled';

const isOverdue = (patrolSegment) => {
  const {start_time, scheduled_start } = patrolSegment;

  return !start_time
    && !!scheduled_start
    && new Date(scheduled_start).getTime() < new Date().getTime(); 
};

const isPending = (patrolSegment) => {
  const { start_time } = patrolSegment;

  return !start_time
  || (!!start_time && new Date(start_time).getTime() > new Date().getTime());
};

const isActive = (patrolSegment) => {
  const { start_time, end_time } = patrolSegment;
  const nowTime = new Date().getTime();

  return !!start_time
    && new Date(start_time).getTime() < nowTime
    && (
      !end_time
      || (!!end_time && new Date(end_time).getTime() > nowTime)
    );
    
};

const isFinished = (patrolSegment) => {
  const { end_time } = patrolSegment;

  return !!end_time && new Date(end_time).getTime() < new Date().getTime();

};

const StatusBadge = (props) => {
  const { data } = props;
  const status = calcPatrolSegmentStatus(data);

  return <span className={styles.statusBadge}><Chevron /> {status}</span>;
};

export default memo(withFormDataContext(StatusBadge));