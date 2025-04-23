import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import AddItemButton from '../../AddItemButton';

import * as styles from './styles.module.scss';

const AddReportButton = ({ className, ...rest }) => {
  const { t } = useTranslation('details-view');

  return <AddItemButton
        aria-label={t('addReportButtonLabel')}
        className={`${className} ${styles.addReportButton}`}
        hideAddPatrolTab
        iconComponent={<DocumentIcon />}
        title={t('addReportButtonTitle')}
        {...rest}
    />;
};

export default memo(AddReportButton);
