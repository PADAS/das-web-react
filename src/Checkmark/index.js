import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import * as styles from './styles.module.scss';

const CheckMark = ({ fullyChecked, onClick, partiallyChecked = false, ...otherProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'checkMark' });

  const checkStateClassName = fullyChecked ? styles.checked : partiallyChecked ? styles.partial : '';

  return <CheckIcon
    className={`${styles.checkmark} ${checkStateClassName} ${onClick ? styles.clickable : ''}`}
    onClick={onClick}
    title={t(fullyChecked ? 'fullyCheckedTitle' : partiallyChecked ? 'partiallyCheckedTitle' : 'uncheckedTitle')}
    {...otherProps}
  />;
};

export default memo(CheckMark);
