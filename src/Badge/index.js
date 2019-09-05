import React, { memo } from 'react';
import { STATUSES } from '../constants';
import styles from './styles.module.scss';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS } = STATUSES;

const calcBadgeColorFromStatus = status => {
  if (!status) return 'red';

  switch (status) {
  case (UNHEALTHY_STATUS): {
    return 'red';
  }
  case WARNING_STATUS: {
    return 'orange';
  }
  case HEALTHY_STATUS: {
    return 'green';
  }
  default: {
    return 'gray';
  }
  }
};

const BadgeIcon = (props) => {
  const { count, status, className, ...rest } = props;
  return <span className={`${styles[calcBadgeColorFromStatus(status)]} ${styles.badge} ${props.className}`} {...rest}>
    {count && <span>{count}</span>}
  </span>;
};

export default memo(BadgeIcon);