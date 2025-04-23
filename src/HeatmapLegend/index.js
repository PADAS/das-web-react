import React, { isValidElement, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';

import MapLegend from '../MapLegend';
import HeatmapStyleControls from '../HeatmapStyleControls';
import HeatmapToggleButton from '../HeatmapToggleButton';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const HeatmapLegend = ({ dayCount, onClose, pointCount, title }) => {
  const { t } = useTranslation('heatmap', { keyPrefix: 'heatmapLegend' });

  const onLegendClose = (event) => {
    onClose(event);

    mapInteractionTracker.track('Close Heatmap');
  };

  return <MapLegend
    onClose={onLegendClose}
    renderSettings={() => <HeatmapStyleControls showCancel={false} />}
    renderTitle={() => <div className={styles.titleWrapper}>
      <HeatmapToggleButton className={styles.heatIcon} heatmapVisible={true} showLabel={false} />

      <div className={styles.innerTitleWrapper}>
        {isValidElement(title) ? title : <h6>{title}</h6>}

        <span>{t('pointCount', { count: pointCount })} {t('dayTimespan', { count: dayCount })}</span>
      </div>
    </div>}
  />;
};

export default memo(HeatmapLegend);
