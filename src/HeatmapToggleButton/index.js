import React, { memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';
import LoadingOverlay from '../LoadingOverlay';

const HeatmapToggleButton = (props) => {
  const { className: externalClass, heatmapVisible, heatmapPartiallyVisible, onButtonClick, showLabel, loading } = props;
  const className = heatmapVisible ? 'visible' : heatmapPartiallyVisible ? 'partial' : '';
  const labelText = className ? 'Heatmap on' : 'Heatmap off';

  return <div className={`${styles.container} ${className} ${showLabel ? ` ${styles.hasLabel}` : ''}`} onClick={showLabel ? onButtonClick : noop}>
    {loading && <LoadingOverlay className={styles.loadingOverlay} />}
    <button title={labelText} type="button" className={`${styles.button} ${styles[className]} ${externalClass || ''}`} onClick={onButtonClick}></button>
    {showLabel && <span>{labelText}</span>}
  </div>;
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