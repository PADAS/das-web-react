import React, { memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

import SubjectControlButton from '../SubjectControls/button';

const HeatmapToggleButton = ({ className, heatmapVisible, heatmapPartiallyVisible, onButtonClick, ...restProps }) => {
  const { t } = useTranslation('heatmap', { keyPrefix: 'heatmapToggleButton' });

  const visibilityClassName = heatmapVisible ? 'visible' : heatmapPartiallyVisible ? 'partial' : '';

  return <SubjectControlButton
    buttonClassName={`${styles.button} ${styles[visibilityClassName]} ${className || ''}`}
    containerClassName={`${styles.container} ${visibilityClassName}`}
    labelText={visibilityClassName ? t('heatmapOnLabel') : t('heatmapOffLabel')}
    onClick={onButtonClick}
    {...restProps}
  />;
};

HeatmapToggleButton.defaultProps = {
  className: '',
  heatmapPartiallyVisible: false,
  onButtonClick: noop,
};

HeatmapToggleButton.propTypes = {
  className: PropTypes.string,
  heatmapVisible: PropTypes.bool.isRequired,
  heatmapPartiallyVisible: PropTypes.bool,
  onButtonClick: PropTypes.func,
};

export default memo(HeatmapToggleButton);
