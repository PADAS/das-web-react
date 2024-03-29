import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import styles from './styles.module.scss';

const CheckMark = ({ fullyChecked, partiallyChecked, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'checkMark' });

  return <CheckIcon
    className={`${styles.checkmark} ${fullyChecked ? styles.checked : partiallyChecked ? styles.partial : ''}`}
    title={t(fullyChecked ? 'fullyCheckedTitle' : partiallyChecked ? 'partiallyCheckedTitle' : 'uncheckedTitle')}
    {...restProps}
  />;
};

CheckMark.defaultProps = {
  partiallyChecked: false,
};

CheckMark.propTypes = {
  fullyChecked: PropTypes.bool.isRequired,
  partiallyChecked: PropTypes.bool,
};

export default memo(CheckMark);
