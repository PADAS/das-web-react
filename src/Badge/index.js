import React from 'react';
import { STATUSES } from '../constants';
import styles from './styles.module.scss';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS } = STATUSES;

const calcBadgeColorFromStatus = status => {
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
}

export default (props) => {
  const { status, className, ...rest } = props;
  return <span className={`${styles[calcBadgeColorFromStatus(status)]} ${styles.badge} ${props.className}`} {...rest}></span>;
};