import React, { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const HeatmapToggleButton = memo(function HeatmapToggleButton (props) {
  const { heatmapVisible, heatmapPartiallyVisible, onButtonClick, showLabel } = props;
  const className = heatmapVisible ? 'heatmap-on' : heatmapPartiallyVisible ? 'heatmap-partial' : '';
  const hoverText = className ? 'Heatmap on' : 'Heatmap off';

  return <div className={styles.container}>
    <button title={hoverText} type="button" className={`${styles.button} ${styles[className]}`} onClick={onButtonClick}></button>
    {showLabel && <span>{hoverText}</span>}
    </div>
});

export default HeatmapToggleButton;

HeatmapToggleButton.defaultProps = {
  onButtonClick() {
    console.log('heatmap button click');
  },
  showLabel: true,
};

HeatmapToggleButton.propTypes = {
  heatmapVisible: PropTypes.bool.isRequired,
  heatmapPartiallyVisible: PropTypes.bool,
  onButtonClick: PropTypes.func,
  showLabel: PropTypes.bool,
};