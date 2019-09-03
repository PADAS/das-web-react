import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import isEqual from 'react-fast-compare';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { LENGTH_ORIGINS, setTrackLength, setTrackLengthRangeOrigin } from '../ducks/tracks';

import LogarithmicSlider from '../LogarithmicSlider';

import styles from './styles.module.scss';

const RANGE_MIN = 1;
const RANGE_MAX = 365;

const { Label, Control } = Form;

const RANGE_INPUT_ATTRS = {
  min: RANGE_MIN,
  max: RANGE_MAX,
};

const TrackLengthControls = (props) => {
  const { trackLength: { origin, length }, eventFilterTimeRange: { lower, upper }, setTrackLength, setTrackLengthRangeOrigin } = props;

  const [customLengthValue, setCustomLengthValue] = useState(length);

  const eventFilterDateRangeLength = differenceInCalendarDays(
    upper || new Date(),
    lower,
  );

  const setTrackLengthToEventDateRange = () => {
    setTrackLength(eventFilterDateRangeLength);
  };

  useEffect(() => {
    if (origin === LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventDateRange();
    }
  }, [origin, lower, upper]);

  useEffect(() => {
    if (origin === LENGTH_ORIGINS.customLength) {
      setTrackLength(customLengthValue);
    }
  }, [origin, customLengthValue]);

  const onOriginChange = ({ target: { value } }) => setTrackLengthRangeOrigin(value);

  const onRangeInputChange = val => setCustomLengthValue(val); //setCustomLengthValue(parseFloat(value));

  const focusRange = () => {
    if (origin !== LENGTH_ORIGINS.customLength) {
      setTrackLengthRangeOrigin(LENGTH_ORIGINS.customLength);
    }
  };
  const isSelected = val => val === origin;

  return <Form onSubmit={form => console.log('range change', form)} style={{ padding: '1rem' }}>
    <h6>Track Length <em>(days)</em></h6>
    <Label htmlFor='filter' className={styles.label}>
      <Control onChange={onOriginChange} id='filter' checked={isSelected(LENGTH_ORIGINS.eventFilter)} className={styles.radio} value={LENGTH_ORIGINS.eventFilter} type='radio' name='track-length-method' />
      <span>Match report filter ({eventFilterDateRangeLength} days)</span>
    </Label>
    <Label htmlFor='custom-length' className={styles.label}>
      <Control onChange={onOriginChange} id='custom-length' checked={isSelected(LENGTH_ORIGINS.customLength)} className={styles.radio} value={LENGTH_ORIGINS.customLength} type='radio' name='track-length-method' />
      <span>Custom length</span>
      <div className={styles.rangeControls}>
        <LogarithmicSlider {...RANGE_INPUT_ATTRS} onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={origin !== LENGTH_ORIGINS.customLength} className={`${styles.rangeSlider} ${origin !== LENGTH_ORIGINS.customLength ? styles.disabled : ''}`} value={customLengthValue} onChange={onRangeInputChange} />
        <input {...RANGE_INPUT_ATTRS} onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={origin !== LENGTH_ORIGINS.customLength} className={`${styles.rangeFreeformInput} ${origin !== LENGTH_ORIGINS.customLength ? styles.disabled : ''}`} type='number' value={customLengthValue} name='range-freeform-input' onChange={({ target: { value } }) => onRangeInputChange(value)} />
      </div>
    </Label>
  </Form>;
};

const mapStatetoProps = ({ view: { trackLength }, data: { eventFilter } }) => ({
  trackLength,
  eventFilterTimeRange: eventFilter.filter.date_range,
});

export default connect(mapStatetoProps, { setTrackLength, setTrackLengthRangeOrigin })(memo(TrackLengthControls));


/*

  if (payload.origin === LENGTH_ORIGINS.eventFilter) {
    const { data: { eventFilter: { filter: { date_range: { lower, upper } } } } } = getState();
    data = {
      origin: payload.origin,
      length: differenceInCalendarDays(
        upper || new Date(),
        lower,
      ),
    };
  }
  data = payload;
*/