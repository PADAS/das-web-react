import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SubjectControlButton from '../SubjectControls/button';

import * as styles from './styles.module.scss';

const SubjectHistoryButton = (props) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectHistoryButton' });

  return <SubjectControlButton
    buttonClassName={styles.button}
    containerClassName={styles.container}
    labelText={t('label')}
    {...props}
  />;
};

export default memo(SubjectHistoryButton);
