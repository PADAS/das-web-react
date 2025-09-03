import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowLeftIcon } from '../../../../common/images/icons/arrow-left.svg';

import CoordinateReferenceSystemFinder from './CoordinateReferenceSystemFinder';
import CoordinateRepresentationsSelector from './CoordinateRepresentationsSelector';

import * as styles from './styles.module.scss';

const CoordinateSystemSettingsView = ({ onOpenMainMapSettingsView }) => {
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView',
  });

  return <>
    <div className={styles.header}>
      <button
        aria-label={t('backButtonLabel')}
        className={styles.backButton}
        onClick={() => onOpenMainMapSettingsView()}
        title={t('backButtonLabel')}
        type="button"
      >
        <ArrowLeftIcon />
      </button>

      <h4 className={styles.title}>{t('title')}</h4>
    </div>

    <CoordinateRepresentationsSelector />

    <CoordinateReferenceSystemFinder />
  </>;
};

export default CoordinateSystemSettingsView;
