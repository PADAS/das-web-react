import React, { memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import SubjectControlButton from '../SubjectControls/button';

const HeatmapToggleButton = (props) => {
  const { className: externalClass, heatmapVisible, heatmapPartiallyVisible, onButtonClick, ...rest } = props;

  const stateClassName = heatmapVisible ? 'visible' : heatmapPartiallyVisible ? 'partial' : '';

  const containerClassName = `${styles.container} ${stateClassName}`;
  const buttonClassName = `${styles.button} ${styles[stateClassName]} ${externalClass || ''}`;

  const labelText = stateClassName ? 'Heatmap on' : 'Heatmap off';

  return <SubjectControlButton buttonClassName={buttonClassName} containerClassName={containerClassName} onClick={onButtonClick} labelText={labelText} {...rest} />;
};

export default memo(HeatmapToggleButton);

HeatmapToggleButton.defaultProps = {
  onButtonClick: noop,
  showLabel: true,
  loading: false,
};

HeatmapToggleButton.propTypes = {
  heatmapVisible: PropTypes.bool.isRequired,
  heatmapPartiallyVisible: PropTypes.bool,
  onButtonClick: PropTypes.func,
  loading: PropTypes.bool,
  showLabel: PropTypes.bool,
};