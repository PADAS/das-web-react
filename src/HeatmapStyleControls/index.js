import React, { memo } from 'react';
import { connect } from 'react-redux';

import LogarithmicSlider from '../LogarithmicSlider';

import { updateHeatmapConfig } from '../ducks/map-ui';

import styles from './styles.module.scss';

const MINIMUM_RADIUS = 10;
const MAXIMUM_RADIUS = 20000;

const MINIMUM_SENSITIVITY = 1;
const MAXIUMUM_SENSITIVITY = 100;

const HIGH_HEAT_WEIGHT = 5;

const HeatmapStyleControls = (props) => {

  const { heatmapStyles: { radiusInMeters, intensity }, updateHeatmapConfig } = props;

  const onRadiusChange = (value) => {
    updateHeatmapConfig({
      radiusInMeters: parseFloat(value) || MINIMUM_RADIUS,
    });
  };

  const onRadiusFieldChange = ({ target: { value } }) => onRadiusChange(value);

  const onSensitivityChange = ({ target: { value } }) => {
    const val = parseFloat(value) || MINIMUM_SENSITIVITY;
    const minimumSensitivityValue = MINIMUM_SENSITIVITY / MAXIUMUM_SENSITIVITY;

    const intensity = Math.max(
      parseFloat(((val - MINIMUM_SENSITIVITY) / (MAXIUMUM_SENSITIVITY - MINIMUM_SENSITIVITY)).toFixed(2)),
      minimumSensitivityValue
    );

    console.log('intensity', intensity);

    updateHeatmapConfig({
      intensity: intensity * HIGH_HEAT_WEIGHT,
    });
  };

  const sensitivityInputValue = (intensity / HIGH_HEAT_WEIGHT) * MAXIUMUM_SENSITIVITY;

  return <form>
    <label htmlFor='heatmap-radius-input'>Radius: <input type='number' step='1' min={MINIMUM_RADIUS} max={MAXIMUM_RADIUS} value={radiusInMeters} onChange={onRadiusFieldChange} />m</label><br />
    <LogarithmicSlider value={radiusInMeters} min={MINIMUM_RADIUS} max={MAXIMUM_RADIUS} onChange={onRadiusChange} />

    <label htmlFor='heatmap-sensitivity-input'>Sensitivity:<br />
      <span>Low</span>
      <input className={styles.sensitivity} type='range' step='1' id='heatmap-sensitivity-input' value={sensitivityInputValue} min={MINIMUM_SENSITIVITY} max={MAXIUMUM_SENSITIVITY} onChange={onSensitivityChange} />
      <span>High</span>
    </label>
  </form>;

};


const mapStatetoProps = ({ view: { heatmapStyles } }) => ({ heatmapStyles });
export default connect(mapStatetoProps, { updateHeatmapConfig })(memo(HeatmapStyleControls));