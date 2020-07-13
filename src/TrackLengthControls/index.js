import React, { memo, useCallback, useState, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { debouncedTrackEvent } from '../utils/analytics';

import { TRACK_LENGTH_ORIGINS, setTrackLength, setTrackLengthRangeOrigin } from '../ducks/tracks';

import styles from './styles.module.scss';

const { Label, Control } = Form;

const RANGE_INPUT_ATTRS = {
  min: 1,
  max: 60,
};

const FREEHAND_INPUT_ATTRS = {
  min: RANGE_INPUT_ATTRS.min,
  max: 365,
};

const debouncedAnalytics = debouncedTrackEvent();

const TrackLengthControls = (props) => {
  const { trackLength: { origin, length }, eventFilterTimeRange: { lower, upper }, setTrackLength, setTrackLengthRangeOrigin } = props;

  const [customLengthValue, setCustomLengthValue] = useState(length);
  const [customLengthValid, setCustomLengthValidity] = useState(true);
  const [initialized, setInitState] = useState(false);

  const eventFilterDateRangeLength = differenceInCalendarDays(
    upper || new Date(),
    lower,
  );

  const setTrackLengthToEventDateRange = useCallback(() => {
    debouncedAnalytics('Map Interaction', 'Set Track Length To Match Report Filter');
    setTrackLength(eventFilterDateRangeLength);
  }, [eventFilterDateRangeLength, setTrackLength]);

  const setTrackLengthToCustomDateRange = useCallback(() => {
    const rangeIsValid = (customLengthValue >= FREEHAND_INPUT_ATTRS.min) && (customLengthValue <= FREEHAND_INPUT_ATTRS.max);
    if (rangeIsValid) {
      setCustomLengthValidity(true);
      setTrackLength(customLengthValue);
      debouncedAnalytics('Map Interaction', 'Set Track Length To Custom Length', `${customLengthValue} days`);
    } else {
      setCustomLengthValidity(false);
    }
  }, [customLengthValue, setTrackLength]);

  useEffect(() => {
    if (origin === TRACK_LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventDateRange();
    } else if (origin === TRACK_LENGTH_ORIGINS.customLength) {
      setTrackLengthToCustomDateRange();
    }
  }, [origin, lower, upper, setTrackLength, eventFilterDateRangeLength, setTrackLengthToEventDateRange, setTrackLengthToCustomDateRange]);


  useEffect(() => {
    if (!initialized) setInitState(true);
  }, [initialized]);

  const onOriginChange = ({ target: { value } }) => setTrackLengthRangeOrigin(value);

  const onRangeInputChange = ({ target: { value } }) => setCustomLengthValue(parseFloat(value));

  const focusRange = () => {
    if (origin !== TRACK_LENGTH_ORIGINS.customLength) {
      setTrackLengthRangeOrigin(TRACK_LENGTH_ORIGINS.customLength);
    }
  };
  const isSelected = val => val === origin;

  return <Form className={styles.form} onSubmit={e => e.preventDefault()}>
    <h6>Track Length:</h6>
    <Label htmlFor='filter' className={styles.label}>
      <Control onChange={onOriginChange} id='filter' checked={isSelected(TRACK_LENGTH_ORIGINS.eventFilter)} className={styles.radio} value={TRACK_LENGTH_ORIGINS.eventFilter} type='radio' name='track-length-method' />
      <span>Match report filter start date ({eventFilterDateRangeLength} days)</span>
    </Label>
    <Label htmlFor='custom-length' className={styles.label}>
      <Control onChange={onOriginChange} id='custom-length' checked={isSelected(TRACK_LENGTH_ORIGINS.customLength)} className={styles.radio} value={TRACK_LENGTH_ORIGINS.customLength} type='radio' name='track-length-method' />
      <span>Custom length</span>
      <div className={styles.rangeControls}>
        <input type='range' {...RANGE_INPUT_ATTRS} onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={origin !== TRACK_LENGTH_ORIGINS.customLength} className={`${styles.rangeSlider} ${origin !== TRACK_LENGTH_ORIGINS.customLength ? styles.disabled : ''}`} value={customLengthValue} onChange={onRangeInputChange} />
        <input autoComplete='off' {...FREEHAND_INPUT_ATTRS} onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={origin !== TRACK_LENGTH_ORIGINS.customLength} className={`${styles.rangeFreeformInput} ${origin !== TRACK_LENGTH_ORIGINS.customLength ? styles.disabled : ''}`} type='number' value={customLengthValue} name='range-freeform-input' onChange={onRangeInputChange} />
      </div>
      {!customLengthValid && <Alert variant='danger'>
        Please enter a track length between {FREEHAND_INPUT_ATTRS.min} and {FREEHAND_INPUT_ATTRS.max}.
      </Alert>}
    </Label>
  </Form>;
};

const mapStatetoProps = ({ view: { trackLength }, data: { eventFilter, tracks } }) => ({
  trackLength,
  tracks,
  eventFilterTimeRange: eventFilter.filter.date_range,
});

export default connect(mapStatetoProps, { setTrackLength, setTrackLengthRangeOrigin })(memo(TrackLengthControls));


TrackLengthControls.defaultProps = {
  virtualDate: null,
};
