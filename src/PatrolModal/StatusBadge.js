import React, { memo, useEffect, useState, useRef } from 'react';
import { withFormDataContext } from '../EditableItem/context';

import { ReactComponent as Chevron } from '../common/images/icons/triple-chevron.svg';

import styles from './styles.module.scss';


const calcPatrolSegmentStatus = (patrol) => {
  const UNKNOWN_STATUS = 'unknown';
  
  const { patrol_segments } = patrol;

  if (!patrol_segments.length) return UNKNOWN_STATUS;

  const [firstLeg]  = patrol_segments;

  if (!firstLeg.time_range) return UNKNOWN_STATUS;

  if (isCanceled(patrol))return 'canceled';
  if (isFinished(firstLeg)) return 'completed';
  if (isOverdue(firstLeg)) return 'overdue';
  if (isPending(firstLeg)) return 'pending';
  if (isActive(firstLeg)) return 'active';

  return UNKNOWN_STATUS;
};

const isCanceled = (patrol) => patrol.state === 'canceled';

const isOverdue = (patrolSegment) => {
  const { time_range: { start_time }, scheduled_start } = patrolSegment;

  return !start_time
    && !!scheduled_start
    && new Date(scheduled_start).getTime() < new Date().getTime(); 
};

const isPending = (patrolSegment) => {
  const { time_range: { start_time } } = patrolSegment;

  return !start_time
  || (!!start_time && new Date(start_time).getTime() > new Date().getTime());
};

const isActive = (patrolSegment) => {
  const { time_range: { start_time, end_time } } = patrolSegment;
  const nowTime = new Date().getTime();

  return !!start_time
    && new Date(start_time).getTime() < nowTime
    && (
      !end_time
      || (!!end_time && new Date(end_time).getTime() > nowTime)
    );
    
};

const isFinished = (patrolSegment) => {
  const { time_range: { end_time } } = patrolSegment;

  return !!end_time && new Date(end_time).getTime() < new Date().getTime();

};

const StatusBadge = (props) => {
  const { data } = props;
  const status = calcPatrolSegmentStatus(data);

  return <span className={styles.statusBadge}><Chevron /> {status}</span>;
};

export default memo(withFormDataContext(StatusBadge));