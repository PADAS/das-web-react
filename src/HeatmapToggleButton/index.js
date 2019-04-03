import React, { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const HeatmapToggleButton = memo(function HeatmapToggleButton (props) {
  const { heatmapVisible, subjectId, onButtonClick } = props;
  const className = heatmapVisible ? 'heatmap-on' : '';
  const hoverText = className ? 'Heatmap on' : 'Heatmap off';

  return <div className={styles.container}>
    <button title={hoverText} type="button" className={`${styles.button} ${styles[className]}`} onClick={() => onButtonClick(subjectId)}></button>
    {hoverText}
    </div>
});

export default HeatmapToggleButton;

HeatmapToggleButton.defaultProps = {
  onButtonClick() {
    console.log('heatmap button click');
  },
};

HeatmapToggleButton.propTypes = {
  heatmapVisible: PropTypes.bool.isRequired,
  onButtonClick: PropTypes.func,
  subjectId: PropTypes.string.isRequired,
};