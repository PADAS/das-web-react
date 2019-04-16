import React, { memo } from 'react';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';
import styles from './styles.module.scss';

export default memo((props) => {
  const { checked, onCheckClick } = props;
  return <CheckIcon className={styles.checkmark} fill='red' stroke='red' />
});