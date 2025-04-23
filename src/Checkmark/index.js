import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import * as styles from './styles.module.scss';

const CheckMark = ({ fullyChecked, partiallyChecked = false, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'checkMark' });

  return <CheckIcon
    className={`${styles.checkmark} ${fullyChecked ? styles.checked : partiallyChecked ? styles.partial : ''}`}
    title={t(fullyChecked ? 'fullyCheckedTitle' : partiallyChecked ? 'partiallyCheckedTitle' : 'uncheckedTitle')}
    {...restProps}
  />;
};

export default memo(CheckMark);
