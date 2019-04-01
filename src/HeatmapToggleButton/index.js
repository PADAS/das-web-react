import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

export default function HeatmapToggleButton (props) {
  const { heatmapVisible, subjectId, onButtonClick } = props;
  const className = heatmapVisible ? 'heatmap-on' : '';
  const hoverText = className ? 'Heatmap visible' : 'Heatmap off';

  return <button title={hoverText} type="button" className={`${styles.button} ${styles[className]}`} onClick={() => onButtonClick(subjectId)}></button>
}

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