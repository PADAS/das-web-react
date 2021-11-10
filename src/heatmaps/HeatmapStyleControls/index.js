import React, { memo, useRef, useState, useCallback } from 'react';
import { connect } from 'react-redux';

import InlineEditable from '../../common/components/forms/InlineEditable';
import LogarithmicSlider from '../../common/components/forms/LogarithmicSlider';

import { updateHeatmapConfig } from '../../ducks/map-ui';

import { debouncedTrackEvent } from '../../utils/analytics';

import styles from './styles.module.scss';

const MINIMUM_RADIUS = 10;
const MAXIMUM_RADIUS = 20000;

const MINIMUM_SENSITIVITY = 1;
const MAXIUMUM_SENSITIVITY = 100;

const HIGH_HEAT_WEIGHT = 5;

const HeatmapStyleControls = (props) => {

  const { heatmapStyles: { radiusInMeters, intensity }, updateHeatmapConfig } = props;

  const trackEventDebounced = useRef(debouncedTrackEvent());
  const [editingRadius, setRadiusEditState] = useState(false);

  const startRadiusEdit = useCallback(() => {
    setRadiusEditState(true);
  }, []);

  const cancelRadiusEdit = useCallback(() => {
    setRadiusEditState(false);
  }, []);

  const onRadiusChange = useCallback((value) => {
    const updateValue = parseFloat(value) || MINIMUM_RADIUS;
    trackEventDebounced.current('Map Interaction', 'Set Heatmap Radius', `${updateValue} meters`);
    updateHeatmapConfig({
      radiusInMeters: updateValue,
    });
    return Promise.resolve();
  }, [updateHeatmapConfig]);

  const onRadiusSave = useCallback((value) => {
    onRadiusChange(value);
    setRadiusEditState(false);
    return Promise.resolve();
  }, [onRadiusChange]);

  const onSensitivityChange = useCallback(({ target: { value } }) => {
    const val = parseFloat(value) || MINIMUM_SENSITIVITY;
    const minimumSensitivityValue = MINIMUM_SENSITIVITY / MAXIUMUM_SENSITIVITY;

    trackEventDebounced.current('Map Interaction', 'Set Heatmap Sensitivity', `${val} out ${MAXIUMUM_SENSITIVITY}`);

    const intensity = Math.max(
      parseFloat(((val - MINIMUM_SENSITIVITY) / (MAXIUMUM_SENSITIVITY - MINIMUM_SENSITIVITY)).toFixed(2)),
      minimumSensitivityValue
    );

    updateHeatmapConfig({
      intensity: intensity * HIGH_HEAT_WEIGHT,
    });
  }, [updateHeatmapConfig]);

  const sensitivityInputValue = (intensity / HIGH_HEAT_WEIGHT) * MAXIUMUM_SENSITIVITY;

  return <div className={styles.controls}>
    <label htmlFor='heatmap-radius-input'>
      <span>Radius (in meters):</span>
      <InlineEditable step='1' onCancel={cancelRadiusEdit}
        editing={editingRadius} onClick={startRadiusEdit} onEsc={cancelRadiusEdit}
        showCancel={false} onSave={onRadiusSave} min={MINIMUM_RADIUS} max={MAXIMUM_RADIUS}
        value={radiusInMeters} onChange={onRadiusChange} /><span className={styles.unit}>m</span>
    </label>
    <LogarithmicSlider value={radiusInMeters} min={MINIMUM_RADIUS} max={MAXIMUM_RADIUS} onChange={onRadiusChange} />

    <label htmlFor='heatmap-sensitivity-input'>
      <span>Sensitivity:</span>
    </label>
    <div>
      Low
      <input className={styles.sensitivity} type='range' step='1' id='heatmap-sensitivity-input' value={sensitivityInputValue} min={MINIMUM_SENSITIVITY} max={MAXIUMUM_SENSITIVITY} onChange={onSensitivityChange} />
      High
    </div>
  </div>;
};

const mapStatetoProps = ({ view: { heatmapStyles } }) => ({ heatmapStyles });
export default connect(mapStatetoProps, { updateHeatmapConfig })(memo(HeatmapStyleControls));