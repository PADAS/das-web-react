import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowLeftIcon } from '../../../../common/images/icons/arrow-left.svg';

import CoordinateReferenceSystemFinder from './CoordinateReferenceSystemFinder';
import GpsFormatSelector from './GpsFormatSelector';

import * as styles from './styles.module.scss';

const CoordinateSettingsView = ({ onOpenMainMapSettingsView }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSettingsView' });

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

    <GpsFormatSelector />

    <CoordinateReferenceSystemFinder />
  </>;
};

export default CoordinateSettingsView;
