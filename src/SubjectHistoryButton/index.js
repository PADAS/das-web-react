import React, { forwardRef, memo } from 'react';
import { useTranslation } from 'react-i18next';

import SubjectControlButton from '../SubjectControls/button';

import styles from './styles.module.scss';

const SubjectHistoryButton = (props, ref) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectHistoryButton' });

  return <SubjectControlButton
    buttonClassName={styles.button}
    containerClassName={styles.container}
    labelText={t('label')}
    ref={ref}
    {...props}
  />;
};

export default memo(forwardRef(SubjectHistoryButton));
