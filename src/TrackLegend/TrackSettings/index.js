import React, { useEffect, useId, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../common/images/icons/cross.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { setTrackLength, setTrackLengthOrigin, TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import NumericInput from '../../NumericInput';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MAX_NUMBER_INPUT_TRACK_LENGTH = 365;
const MAX_RANGE_INPUT_TRACK_LENGTH = 60;
const MIN_TRACK_LENGTH = 1;

const TrackSettings = ({ onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.trackSettings' });

  const lowerEventFilterDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.lower);
  const trackSettings = useSelector((state) => state.view.trackSettings);

  // Every track legend on the map holds a copy of these settings, so none of
  // them can name its own controls.
  const customLengthErrorMessageId = useId();
  const customLengthOptionId = useId();
  const eventFilterOptionId = useId();

  const [customLength, setCustomLength] = useState(trackSettings.length);

  const lengthFromEventFilterLowerRangeToToday = differenceInCalendarDays(new Date(), lowerEventFilterDateRange);

  const applyCustomLength = (length) => {
    if ((length >= MIN_TRACK_LENGTH) && (length <= MAX_NUMBER_INPUT_TRACK_LENGTH)) {
      dispatch(setTrackLength(length));

      mapInteractionTracker.debouncedTrack('Set Track Length To Custom Length', `${length} days`);
    }
  };

  const onCustomLengthChange = (length) => {
    setCustomLength(length);

    applyCustomLength(length);
  };

  const onTrackLengthChange = (event) => {
    dispatch(setTrackLengthOrigin(event.target.value));

    if (event.target.value === TRACK_LENGTH_ORIGINS.EVENT_FILTER) {
      mapInteractionTracker.track('Set Track Length To Match Report Filter');
    } else {
      applyCustomLength(customLength);
    }
  };

  useEffect(() => {
    // If the track length origin is the event filter, the track length follows the filter lower date range.
    if (trackSettings.origin === TRACK_LENGTH_ORIGINS.EVENT_FILTER) {
      dispatch(setTrackLength(lengthFromEventFilterLowerRangeToToday));
    }
  }, [dispatch, lengthFromEventFilterLowerRangeToToday, trackSettings.origin]);

  // The inputs only drive the track length while the custom length is what it
  // follows, so a disabled pair of them is never the one in error.
  const isCustomLengthValid = trackSettings.origin !== TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH
    || ((customLength >= MIN_TRACK_LENGTH) && (customLength <= MAX_NUMBER_INPUT_TRACK_LENGTH));

  return <div className={styles.trackSettings}>
    <div className={styles.header}>
      <h2 className={styles.title}>{t('title')}</h2>

      <button
        aria-label={t('closeButtonLabel')}
        className={styles.closeButton}
        onClick={() => onClose()}
        title={t('closeButtonLabel')}
        type="button"
      >
        <CrossIcon aria-hidden="true" />
      </button>
    </div>

    <fieldset className={styles.trackLengthFieldSet}>
      <legend className={styles.trackLengthLegend}>{t('trackLengthLegend')}</legend>

      <div className={styles.radioButton}>
        <input
          className={styles.input}
          checked={trackSettings.origin === TRACK_LENGTH_ORIGINS.EVENT_FILTER}
          id={eventFilterOptionId}
          onChange={onTrackLengthChange}
          type="radio"
          value={TRACK_LENGTH_ORIGINS.EVENT_FILTER}
        />

        <label className={styles.label} htmlFor={eventFilterOptionId}>
          {t('eventFilterRadioLabel', { length: lengthFromEventFilterLowerRangeToToday })}
        </label>
      </div>

      <div className={styles.radioButton}>
        <input
          className={styles.input}
          checked={trackSettings.origin === TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
          id={customLengthOptionId}
          onChange={onTrackLengthChange}
          type="radio"
          value={TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
        />

        <label className={styles.label} htmlFor={customLengthOptionId}>
          {t('customLengthRadioLabel')}
        </label>
      </div>
    </fieldset>

    <div className={styles.customLengthInputs}>
      <input
        aria-errormessage={isCustomLengthValid ? undefined : customLengthErrorMessageId}
        aria-invalid={isCustomLengthValid ? 'false' : 'true'}
        aria-label={t('customLengthInputLabel')}
        className={styles.rangeInput}
        disabled={trackSettings.origin !== TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
        max={MAX_RANGE_INPUT_TRACK_LENGTH}
        min={MIN_TRACK_LENGTH}
        onChange={(event) => onCustomLengthChange(parseInt(event.target.value))}
        step={1}
        title={t('customLengthInputLabel')}
        type="range"
        value={customLength}
      />

      <NumericInput
        className={styles.numberInput}
        disabled={trackSettings.origin !== TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH}
        inputProps={{
          'aria-errormessage': isCustomLengthValid ? undefined : customLengthErrorMessageId,
          'aria-invalid': isCustomLengthValid ? 'false' : 'true',
          'aria-label': t('customLengthInputLabel'),
        }}
        max={MAX_NUMBER_INPUT_TRACK_LENGTH}
        min={MIN_TRACK_LENGTH}
        onChange={(number) => onCustomLengthChange(number)}
        title={t('customLengthInputLabel')}
        value={customLength}
      />
    </div>

    {!isCustomLengthValid && <p
      className={styles.customLengthErrorMessage}
      id={customLengthErrorMessageId}
    >
      {t('customLengthErrorMessage', { max: MAX_NUMBER_INPUT_TRACK_LENGTH, min: MIN_TRACK_LENGTH })}
    </p>}
  </div>;
};

export default TrackSettings;
