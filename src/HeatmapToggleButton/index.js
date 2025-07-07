import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

import SubjectControlButton from '../SubjectControls/button';

const HeatmapToggleButton = ({
  className = '',
  heatmapVisible,
  heatmapPartiallyVisible = false,
  onButtonClick = null,
  ...restProps
}) => {
  const { t } = useTranslation('heatmap', { keyPrefix: 'heatmapToggleButton' });

  const visibilityClassName = heatmapVisible ? 'visible' : heatmapPartiallyVisible ? 'partial' : '';

  return <SubjectControlButton
    buttonClassName={`${styles.button} ${styles[visibilityClassName]} ${className || ''}`}
    containerClassName={`${styles.container} ${visibilityClassName}`}
    labelText={visibilityClassName ? t('heatmapOnLabel') : t('heatmapOffLabel')}
    onClick={onButtonClick}
    data-testid="heatmap-toggle-button"
    {...restProps}
  />;
};

export default memo(HeatmapToggleButton);
