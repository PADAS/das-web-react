import React, { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const HeatmapToggleButton = memo(function HeatmapToggleButton (props) {
  const { heatmapVisible, subjectId, onButtonClick, showLabel } = props;
  const className = heatmapVisible ? 'heatmap-on' : '';
  const hoverText = className ? 'Heatmap on' : 'Heatmap off';

  return <div className={styles.container}>
    <button title={hoverText} type="button" className={`${styles.button} ${styles[className]}`} onClick={() => onButtonClick(subjectId)}></button>
    {showLabel && hoverText}
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
  onButtonClick: PropTypes.func,
  subjectId: PropTypes.string.isRequired,
  showLabel: PropTypes.bool,
};