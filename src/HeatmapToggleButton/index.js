import React, { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';
import LoadingOverlay from '../LoadingOverlay';

const HeatmapToggleButton = (props) => {
  const { className: externalClass, heatmapVisible, heatmapPartiallyVisible, onButtonClick, showLabel, loading } = props;
  const className = heatmapVisible ? 'heatmap-on' : heatmapPartiallyVisible ? 'heatmap-partial' : '';
  const hoverText = className ? 'Heatmap on' : 'Heatmap off';

  return <div className={`${styles.container}${showLabel ? ` ${styles.hasLabel}` : ''}`}>
    {loading && <LoadingOverlay className={styles.loadingOverlay} />}
    <button title={hoverText} type="button" className={`${styles.button} ${styles[className]} ${externalClass || ''}`} onClick={onButtonClick}></button>
    {showLabel && <span>{hoverText}</span>}
  </div>;
};

export default memo(HeatmapToggleButton);

HeatmapToggleButton.defaultProps = {
  onButtonClick() {
  },
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