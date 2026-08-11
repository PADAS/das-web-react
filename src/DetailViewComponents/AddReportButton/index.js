import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import AddItemButton from '../../AddItemButton';

import * as styles from './styles.module.scss';

const AddReportButton = (props) => {
  const { t } = useTranslation('details-view');

  return <AddItemButton
        aria-label={t('addReportButtonLabel')}
        className={styles.addReportButton}
        hideAddPatrolTab
        iconComponent={<DocumentIcon aria-hidden="true" />}
        title={t('addReportButtonTitle')}
        variant="plain"
        {...props}
    />;
};

export default memo(AddReportButton);
