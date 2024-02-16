import React, { memo, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { updateHeatmapConfig } from '../ducks/map-ui';

import InlineEditable from '../InlineEditable';
import LogarithmicSlider from '../LogarithmicSlider';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MINIMUM_RADIUS = 10;
const MAXIMUM_RADIUS = 20000;

const MINIMUM_SENSITIVITY = 1;
const MAXIUMUM_SENSITIVITY = 100;

const HIGH_HEAT_WEIGHT = 5;

const HeatmapStyleControls = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('heatmap', { keyPrefix: 'heatmapStyleControls' });

  const heatmapStyles = useSelector((state) => state.view.heatmapStyles);

  const trackEventDebounced = useRef(mapInteractionTracker.debouncedTrack());

  const [editingRadius, setRadiusEditState] = useState(false);

  const onRadiusChange = useCallback((value) => {
    const updateValue = parseFloat(value) || MINIMUM_RADIUS;
    dispatch(updateHeatmapConfig({ radiusInMeters: updateValue }));

    trackEventDebounced.current('Set Heatmap Radius', `${updateValue} meters`);
  }, [dispatch]);

  const onRadiusSave = useCallback((value) => {
    onRadiusChange(value);
    setRadiusEditState(false);
  }, [onRadiusChange]);

  const onSensitivityChange = useCallback((event) => {
    const value = parseFloat(event.target.value) || MINIMUM_SENSITIVITY;
    const minimumSensitivityValue = MINIMUM_SENSITIVITY / MAXIUMUM_SENSITIVITY;

    const intensity = Math.max(
      parseFloat(((value - MINIMUM_SENSITIVITY) / (MAXIUMUM_SENSITIVITY - MINIMUM_SENSITIVITY)).toFixed(2)),
      minimumSensitivityValue
    );

    dispatch(updateHeatmapConfig({ intensity: intensity * HIGH_HEAT_WEIGHT }));

    trackEventDebounced.current('Set Heatmap Sensitivity', `${value} out ${MAXIUMUM_SENSITIVITY}`);
  }, [dispatch]);

  const sensitivityInputValue = (heatmapStyles.intensity / HIGH_HEAT_WEIGHT) * MAXIUMUM_SENSITIVITY;
  return <div className={styles.controls}>
    <label htmlFor="heatmap-radius-input">
      <span>{t('radiusLabel')}</span>

      <InlineEditable
        editing={editingRadius}
        max={MAXIMUM_RADIUS}
        min={MINIMUM_RADIUS}
        onCancel={() => setRadiusEditState(false)}
        onChange={onRadiusChange}
        onClick={() => setRadiusEditState(true)}
        onEsc={() => setRadiusEditState(false)}
        onSave={onRadiusSave}
        showCancel={false}
        step="1"
        value={heatmapStyles.radiusInMeters}
      />

      <span className={styles.unit}>{t('radiusUnit')}</span>
    </label>

    <LogarithmicSlider
      max={MAXIMUM_RADIUS}
      min={MINIMUM_RADIUS}
      onChange={onRadiusChange}
      value={heatmapStyles.radiusInMeters}
    />

    <label htmlFor="heatmap-sensitivity-input">
      <span>{t('sensitivityLabel')}</span>
    </label>

    <div>
      {t('sensitivityLowIndicator')}

      <input
        className={styles.sensitivity}
        id="heatmap-sensitivity-input"
        max={MAXIUMUM_SENSITIVITY}
        min={MINIMUM_SENSITIVITY}
        onChange={onSensitivityChange}
        step="1"
        type="range"
        value={sensitivityInputValue}
      />

      {t('sensitivityHighIndicator')}
    </div>
  </div>;
};

export default memo(HeatmapStyleControls);
