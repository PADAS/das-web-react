import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import AddItemButton from '../../AddItemButton';

import styles from './styles.module.scss';

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

AddReportButton.propTypes = { className: PropTypes.string };

export default memo(AddReportButton);
