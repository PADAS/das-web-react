import React, { useEffect, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../common/images/icons/cross.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { setTrackLength, setTrackLengthOrigin, TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import NumericInput from '../../NumericInput';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MAX_NUMBER_INPUT_TRACK_LENGTH = 365;
const MAX_RANGE_INPUT_TRACK_LENGTH = 60;
const MIN_TRACK_LENGTH = 1;

const TrackSettings = ({ onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.trackSettings' });

  const eventFilterDateRange = useSelector((state) => state.data.eventFilter.filter.date_range);
  const trackSettings = useSelector((state) => state.view.trackSettings);

  const [customLength, setCustomLength] = useState(trackSettings.length);
  const [isCustomLengthValid, setIsCustomLengthValid] = useState(true);

  const lengthFromEventFilterLowerRangeToToday = differenceInCalendarDays(new Date(), eventFilterDateRange.lower);

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
    // If the track length origin is set to a custom length, the track length follows the inputs while they ahve a
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
        aria-invalid={!isCustomLengthValid}
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
          'aria-invalid': !isCustomLengthValid,
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
  </div>;
};

export default TrackSettings;
