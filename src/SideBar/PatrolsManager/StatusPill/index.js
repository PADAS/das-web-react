import React from 'react';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const StatusPill = ({
  as: Component = 'span',
  children = null,
  className = '',
  isDirty = false,
  state,
  ...otherProps
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'statusPill' });

  return <Component className={`${styles.statusPill} ${styles[state.key]} ${className}`} {...otherProps}>
    <span className={isDirty ? styles.unsavedLabel : undefined}>{t(`uiStateTitles.${state.key}`)}</span>

    {children}
  </Component>;
};

export default StatusPill;
