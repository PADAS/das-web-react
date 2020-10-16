import React, { memo } from 'react';
import { withFormDataContext } from '../EditableItem/context';

import { ReactComponent as Chevron } from '../common/images/icons/triple-chevron.svg';
import { isPatrolCancelled, isSegmentFinished, 
  isSegmentOverdue, isSegmentPending, isSegmentActive} from '../utils/patrols';

import styles from './styles.module.scss';


const calcPatrolSegmentStatus = (patrol) => {
  const UNKNOWN_STATUS = 'unknown';
  
  const { patrol_segments } = patrol;

  if (!patrol_segments.length) return UNKNOWN_STATUS;

  const [firstLeg]  = patrol_segments;

  if (!firstLeg.time_range) return UNKNOWN_STATUS;

  if (isPatrolCancelled(patrol))return 'canceled';
  if (isSegmentFinished(firstLeg)) return 'completed';
  if (isSegmentOverdue(firstLeg)) return 'overdue';
  if (isSegmentPending(firstLeg)) return 'pending';
  if (isSegmentActive(firstLeg)) return 'active';

  return UNKNOWN_STATUS;
};

const StatusBadge = (props) => {
  const { data } = props;
  const status = calcPatrolSegmentStatus(data);

  return <span className={styles.statusBadge}><Chevron /> {status}</span>;
};

export default memo(withFormDataContext(StatusBadge));