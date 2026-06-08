import React, { useEffect, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../common/images/icons/cross.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../utils/analytics';
import {
  setTrackLength,
  setTrackLengthOrigin,
  TRACK_LENGTH_ORIGINS,
  setIsSegmentOnTimeEnabled,
  setIsSegmentOnSpeedEnabled,
  setSegmentTimeGapLength,
  setSegmentSpeedLimit,
} from '../../ducks/tracks';

import NumericInput from '../../NumericInput';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MAX_NUMBER_INPUT_TRACK_LENGTH = 365;
const MAX_RANGE_INPUT_TRACK_LENGTH = 60;
const MIN_TRACK_LENGTH = 1;

// Time gap constants (2 minutes to 24 hours in seconds)
const MIN_TIME_GAP = 120;
const MAX_TIME_GAP = 86400;
const MIN_TIME_GAP_LOG = Math.log10(MIN_TIME_GAP);
const MAX_TIME_GAP_LOG = Math.log10(MAX_TIME_GAP);

// Speed limit constants (1 to 500 km/h)
const MIN_SPEED_LIMIT = 1;
const MAX_SPEED_LIMIT = 500;
const MIN_SPEED_LIMIT_LOG = Math.log10(MIN_SPEED_LIMIT);
const MAX_SPEED_LIMIT_LOG = Math.log10(MAX_SPEED_LIMIT);

// Helper functions for logarithmic conversion
const valueToLogSlider = (value, minLog, maxLog) => {
  const logValue = Math.log10(value);
  return ((logValue - minLog) / (maxLog - minLog)) * 100;
};

const logSliderToValue = (sliderPosition, minLog, maxLog, minValue, maxValue) => {
  const logValue = minLog + (sliderPosition / 100) * (maxLog - minLog);
  const value = Math.pow(10, logValue);
  return Math.max(minValue, Math.min(maxValue, value));
};

const TrackSettings = ({ onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.trackSettings' });

  const lowerEventFilterDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.lower);
  const trackSettings = useSelector((state) => state.view.trackSettings);

  const [customLength, setCustomLength] = useState(trackSettings.length);
  const [isCustomLengthValid, setIsCustomLengthValid] = useState(true);

  const lengthFromEventFilterLowerRangeToToday = differenceInCalendarDays(new Date(), lowerEventFilterDateRange);

  const onTrackLengthChange = (event) => {
    dispatch(setTrackLengthOrigin(event.target.value));

    if (event.target.value === TRACK_LENGTH_ORIGINS.EVENT_FILTER) {
      mapInteractionTracker.track('Set Track Length To Match Report Filter');
    }
  };

  useEffect(() => {
    // If the track length origin is the event filter, the track length follows the filter lower date range.
    if (trackSettings.origin === TRACK_LENGTH_ORIGINS.EVENT_FILTER) {
      dispatch(setTrackLength(lengthFromEventFilterLowerRangeToToday));
    }
  }, [dispatch, lengthFromEventFilterLowerRangeToToday, trackSettings.origin]);

  useEffect(() => {
    // If the track length origin is set to a custom length, the track length follows the inputs while they have a
    // valid value.
    if (trackSettings.origin === TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH) {
      const isCustomLengthValid = (customLength >= MIN_TRACK_LENGTH)
        && (customLength <= MAX_NUMBER_INPUT_TRACK_LENGTH);
      if (isCustomLengthValid) {
        dispatch(setTrackLength(customLength));

        mapInteractionTracker.debouncedTrack('Set Track Length To Custom Length', `${customLength} days`);
      }

      setIsCustomLengthValid(isCustomLengthValid);
    }
  }, [customLength, dispatch, trackSettings.origin]);

  return <div className={styles.trackSettings}>
    <div className={styles.header}>
      <p className={styles.title}>{t('title')}</p>

      <button
        aria-label={t('closeButtonLabel')}
        className={styles.closeButton}
        onClick={() => onClose()}
        title={t('closeButtonLabel')}
        type="button"
      >
        <CrossIcon className={styles.crossIcon} />
      </button>
    </div>

    <fieldset>
      <legend className={styles.trackLengthLegend}>{t('trackLengthLegend')}</legend>

      <div className={styles.radioButton}>
        <input
          className={styles.input}
          checked={trackSettings.origin === TRACK_LENGTH_ORIGINS.EVENT_FILTER}
          id="trackLength-eventFilterOption"
          onChange={onTrackLengthChange}
          type="radio"
          value={TRACK_LENGTH_ORIGINS.EVENT_FILTER}
        />

        <label className={styles.label} htmlFor="trackLength-eventFilterOption">
          {t('eventFilterRadioLabel', { length: lengthFromEventFilterLowerRangeToToday })}
        </label>
      </div>

      <div className={styles.radioButton}>
        <input
          className={styles.input}
          checked={trackSettings.origin === TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
          id="trackLength-customLengthOption"
          onChange={onTrackLengthChange}
          type="radio"
          value={TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
        />

        <label className={styles.label} htmlFor="trackLength-customLengthOption">
          {t('customLengthRadioLabel')}
        </label>
      </div>
    </fieldset>

    <div className={styles.customLengthInputs}>
      <input
        aria-errormessage={!isCustomLengthValid ? 'customLengthErrorMessage' : undefined}
        aria-invalid={isCustomLengthValid ? 'false' : 'true'}
        aria-label={t('customLengthInputLabel')}
        className={styles.rangeInput}
        disabled={trackSettings.origin !== TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
        max={MAX_RANGE_INPUT_TRACK_LENGTH}
        min={MIN_TRACK_LENGTH}
        onChange={(event) => setCustomLength(parseInt(event.target.value))}
        step={1}
        title={t('customLengthInputLabel')}
        type="range"
        value={customLength}
      />

      <NumericInput
        className={styles.numberInput}
        disabled={trackSettings.origin !== TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
        inputProps={{
          'aria-errormessage': !isCustomLengthValid ? 'customLengthErrorMessage' : undefined,
          'aria-invalid': isCustomLengthValid ? 'false' : 'true',
          'aria-label': t('customLengthInputLabel'),
        }}
        max={MAX_NUMBER_INPUT_TRACK_LENGTH}
        min={MIN_TRACK_LENGTH}
        onChange={(number) => setCustomLength(number)}
        title={t('customLengthInputLabel')}
        value={customLength}
      />
    </div>

    {!isCustomLengthValid && trackSettings.origin === TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH && <p
      className={styles.customLengthErrorMessage}
      id="customLengthErrorMessage"
    >
      {t('customLengthErrorMessage', { max: MAX_NUMBER_INPUT_TRACK_LENGTH, min: MIN_TRACK_LENGTH })}
    </p>}

    <fieldset className={styles.segmentationSettings}>
      <legend className={styles.segmentationLegend}>{t('segmentationLegend')}</legend>

      <div className={styles.segmentationControl}>
        <div className={styles.segmentationHeader}>
          <input
            className={styles.checkbox}
            checked={trackSettings.isSegmentOnTimeEnabled}
            id="segmentOnTime-checkbox"
            onChange={(event) => dispatch(setIsSegmentOnTimeEnabled(event.target.checked))}
            type="checkbox"
          />
          <label className={styles.label} htmlFor="segmentOnTime-checkbox">
            {t('segmentOnTimeLabel')}
          </label>
        </div>

        <div className={styles.sliderInputs}>
          <input
            aria-label={t('timeGapInputLabel')}
            className={styles.rangeInput}
            disabled={!trackSettings.isSegmentOnTimeEnabled}
            max={100}
            min={0}
            onChange={(event) => {
              const sliderValue = parseFloat(event.target.value);
              const actualValue = Math.round(logSliderToValue(sliderValue, MIN_TIME_GAP_LOG, MAX_TIME_GAP_LOG, MIN_TIME_GAP, MAX_TIME_GAP));
              dispatch(setSegmentTimeGapLength(actualValue));
            }}
            step={0.1}
            title={t('timeGapInputLabel')}
            type="range"
            value={valueToLogSlider(trackSettings.segmentTimeGapLength, MIN_TIME_GAP_LOG, MAX_TIME_GAP_LOG)}
          />

          <NumericInput
            className={styles.numberInput}
            disabled={!trackSettings.isSegmentOnTimeEnabled}
            inputProps={{
              'aria-label': t('timeGapInputLabel'),
            }}
            max={MAX_TIME_GAP}
            min={MIN_TIME_GAP}
            onChange={(number) => dispatch(setSegmentTimeGapLength(number))}
            title={t('timeGapInputLabel')}
            value={trackSettings.segmentTimeGapLength}
          />
        </div>
      </div>

      <div className={styles.segmentationControl}>
        <div className={styles.segmentationHeader}>
          <input
            className={styles.checkbox}
            checked={trackSettings.isSegmentOnSpeedEnabled}
            id="segmentOnSpeed-checkbox"
            onChange={(event) => dispatch(setIsSegmentOnSpeedEnabled(event.target.checked))}
            type="checkbox"
          />
          <label className={styles.label} htmlFor="segmentOnSpeed-checkbox">
            {t('segmentOnSpeedLabel')}
          </label>
        </div>

        <div className={styles.sliderInputs}>
          <input
            aria-label={t('speedLimitInputLabel')}
            className={styles.rangeInput}
            disabled={!trackSettings.isSegmentOnSpeedEnabled}
            max={100}
            min={0}
            onChange={(event) => {
              const sliderValue = parseFloat(event.target.value);
              const actualValue = logSliderToValue(sliderValue, MIN_SPEED_LIMIT_LOG, MAX_SPEED_LIMIT_LOG, MIN_SPEED_LIMIT, MAX_SPEED_LIMIT);
              dispatch(setSegmentSpeedLimit(actualValue));
            }}
            step={0.1}
            title={t('speedLimitInputLabel')}
            type="range"
            value={valueToLogSlider(trackSettings.segmentSpeedLimit, MIN_SPEED_LIMIT_LOG, MAX_SPEED_LIMIT_LOG)}
          />

          <NumericInput
            className={styles.numberInput}
            disabled={!trackSettings.isSegmentOnSpeedEnabled}
            inputProps={{
              'aria-label': t('speedLimitInputLabel'),
            }}
            max={MAX_SPEED_LIMIT}
            min={MIN_SPEED_LIMIT}
            onChange={(number) => dispatch(setSegmentSpeedLimit(number))}
            title={t('speedLimitInputLabel')}
            value={trackSettings.segmentSpeedLimit}
          />
        </div>
      </div>
    </fieldset>
  </div>;
};

export default TrackSettings;
