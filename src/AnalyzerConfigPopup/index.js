import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';

import styles from './styles.module.scss';

const CATEGORY_ICONS = {
  'geofence': <GeofenceIcon className={styles.typeIcon} />,
  'proximity': <ProximityIcon className={styles.typeIcon} />,
};

const AnalyzerConfigPopup = ({ data }) => {
  const { t } = useTranslation('map-popups', { keyPrefix: 'analyzerConfigPopup' });

  return <div className={styles.analyzerPopup}>
    <h4>
      {CATEGORY_ICONS[data.properties.analyzer_type]}

      {data.properties.title}

      <a target="_blank" rel="noopener noreferrer" href={data.properties.admin_href}>
        <GearIcon className={styles.gearIcon} />
      </a>
    </h4>

    <h5>{t(`analyzerTypeHeader.${data.properties.analyzer_type}`)}</h5>
  </div>;
};

export default AnalyzerConfigPopup;
