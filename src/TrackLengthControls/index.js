import React, { memo, useCallback, useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays } from 'date-fns';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { setTrackLength, setTrackLengthRangeOrigin, TRACK_LENGTH_ORIGINS } from '../ducks/tracks';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const RANGE_INPUT_ATTRS = { max: 60, min: 1 };
const FREEHAND_INPUT_ATTRS = { max: 365, min: RANGE_INPUT_ATTRS.min };

const TrackLengthControls = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLengthControls' });

  const eventFilterDateRange = useSelector((state) => state.data.eventFilter.filter.date_range);
  const trackLength = useSelector((state) => state.view.trackLength);

  const [customLengthValid, setCustomLengthValidity] = useState(true);
  const [customLengthValue, setCustomLengthValue] = useState(trackLength.length);
  const [initialized, setInitState] = useState(false);

  const eventFilterDateRangeLength = differenceInCalendarDays(new Date(), eventFilterDateRange.lower);

  const focusRange = () => {
    if (trackLength.origin !== TRACK_LENGTH_ORIGINS.customLength) {
      dispatch(setTrackLengthRangeOrigin(TRACK_LENGTH_ORIGINS.customLength));
    }
  };

  const setTrackLengthToEventDateRange = useCallback(() => {
    mapInteractionTracker.debouncedTrack('Set Track Length To Match Report Filter');

    dispatch(setTrackLength(eventFilterDateRangeLength));
  }, [dispatch, eventFilterDateRangeLength]);

  const setTrackLengthToCustomDateRange = useCallback(() => {
    const rangeIsValid = (customLengthValue >= FREEHAND_INPUT_ATTRS.min)
      && (customLengthValue <= FREEHAND_INPUT_ATTRS.max);
    if (rangeIsValid) {
      setCustomLengthValidity(true);
      dispatch(setTrackLength(customLengthValue));

      mapInteractionTracker.debouncedTrack('Set Track Length To Custom Length', `${customLengthValue} days`);
    } else {
      setCustomLengthValidity(false);
    }
  }, [customLengthValue, dispatch]);

  useEffect(() => {
    if (trackLength.origin === TRACK_LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventDateRange();
    } else if (trackLength.origin === TRACK_LENGTH_ORIGINS.customLength) {
      setTrackLengthToCustomDateRange();
    }
  }, [
    eventFilterDateRange,
    eventFilterDateRangeLength,
    setTrackLengthToCustomDateRange,
    setTrackLengthToEventDateRange,
    trackLength.origin,
  ]);

  useEffect(() => {
    if (!initialized) {
      setInitState(true);
    }
  }, [initialized]);

  return <Form className={styles.form} onSubmit={(event) => event.preventDefault()}>
    <h6>{t('header')}</h6>

    <Form.Label className={styles.label} htmlFor="filter">
      <Form.Check
        checked={TRACK_LENGTH_ORIGINS.eventFilter === trackLength.origin}
        className={styles.radio}
        id="filter"
        name="track-length-method"
        onChange={(event) => dispatch(setTrackLengthRangeOrigin(event.target.value))}
        type="radio"
        value={TRACK_LENGTH_ORIGINS.eventFilter}
      />

      <span>{t('matchReportFilterDateLabel', { reportFilterDateRangeLength: eventFilterDateRangeLength })}</span>
    </Form.Label>

    <Form.Label className={styles.label} htmlFor="custom-length">
      <Form.Check
        checked={TRACK_LENGTH_ORIGINS.customLength === trackLength.origin}
        className={styles.radio}
        id="custom-length"
        name="track-length-method"
        onChange={(event) => dispatch(setTrackLengthRangeOrigin(event.target.value))}
        type="radio"
        value={TRACK_LENGTH_ORIGINS.customLength}
      />

      <span>{t('customLengthLabel')}</span>

      <div className={styles.rangeControls}>
        <input
          type="range"
          {...RANGE_INPUT_ATTRS}
          className={`${styles.rangeSlider} ${trackLength.origin !== TRACK_LENGTH_ORIGINS.customLength ? styles.disabled : ''}`}
          disabled={trackLength.origin !== TRACK_LENGTH_ORIGINS.customLength}
          onChange={(event) => setCustomLengthValue(parseFloat(event.target.value))}
          onFocus={focusRange}
          onMouseDown={focusRange}
          onTouchStart={focusRange}
          value={customLengthValue}
        />

        <input
          autoComplete="off"
          {...FREEHAND_INPUT_ATTRS}
          className={`${styles.rangeFreeformInput} ${trackLength.origin !== TRACK_LENGTH_ORIGINS.customLength ? styles.disabled : ''}`}
          disabled={trackLength.origin !== TRACK_LENGTH_ORIGINS.customLength}
          name="range-freeform-input"
          onChange={(event) => setCustomLengthValue(parseFloat(event.target.value))}
          onFocus={focusRange}
          onMouseDown={focusRange}
          onTouchStart={focusRange}
          type="number"
          value={customLengthValue}
        />
      </div>

      {!customLengthValid && <Alert variant="danger">
        {t('invalidCustomLengthAlert', { max: FREEHAND_INPUT_ATTRS.max, min: FREEHAND_INPUT_ATTRS.min })}
      </Alert>}
    </Form.Label>
  </Form>;
};

export default memo(TrackLengthControls);
