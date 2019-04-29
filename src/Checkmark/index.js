import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';
import styles from './styles.module.scss';

const CheckMark = memo((props) => {
  const { fullyChecked, partiallyChecked, ...rest } = props;
  return <CheckIcon className={`${styles.checkmark} ${fullyChecked ? styles.checked : partiallyChecked ? styles.partial : ''}`} {...rest} />
});

export default CheckMark;

CheckMark.propTypes = {
  fullyChecked: PropTypes.bool.isRequired,
  partiallyChecked: PropTypes.bool.isRequired,
};