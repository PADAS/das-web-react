import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';
import styles from './styles.module.scss';

const CheckMark = memo((props) => {
  const { checked, ...rest } = props;
  return <CheckIcon className={`${styles.checkmark} ${checked ? styles.checked : ''}`} {...rest}/>
});

export default CheckMark;

CheckMark.propTypes = {
  checked: PropTypes.bool.isRequired,
};