import React from 'react';
import { STATUSES } from '../constants';
import styles from './styles.module.scss';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS, UNKNOWN_STATUS } = STATUSES;

const calcBadgeColorFromStatus = status => {
  switch (status) {
    case (UNKNOWN_STATUS): {
      return 'gray';
    }
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
}

export default (props) => {
  console.log('styles', styles);
  const { status, ...rest } = props;
  return <span className={`${styles[calcBadgeColorFromStatus(status)]} ${styles.badge}`}></span>;
};