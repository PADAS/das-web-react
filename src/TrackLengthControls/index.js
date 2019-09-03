import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from 'react-bootstrap/Form';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { TRACK_LENGTH_ORIGINS, setTrackLength, setTrackLengthRangeOrigin, fetchTracks } from '../ducks/tracks';


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
    if (origin === TRACK_LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventDateRange();
    }
  }, [origin, lower, upper]);

  useEffect(() => {
    if (origin === TRACK_LENGTH_ORIGINS.customLength) {
      setTrackLength(customLengthValue);
    }
  }, [origin, customLengthValue]);

  const onOriginChange = ({ target: { value } }) => setTrackLengthRangeOrigin(value);

  const onRangeInputChange = val => setCustomLengthValue(val); //setCustomLengthValue(parseFloat(value));

  const focusRange = () => {
    if (origin !== TRACK_LENGTH_ORIGINS.customLength) {
      setTrackLengthRangeOrigin(TRACK_LENGTH_ORIGINS.customLength);
    }
  };
  const isSelected = val => val === origin;

  return <Form onSubmit={form => console.log('range change', form)}>
    <Label htmlFor='filter' className={styles.label}>
      <Control onChange={onOriginChange} id='filter' checked={isSelected(TRACK_LENGTH_ORIGINS.eventFilter)} className={styles.radio} value={TRACK_LENGTH_ORIGINS.eventFilter} type='radio' name='track-length-method' />
      <span>Match report filter ({eventFilterDateRangeLength} days)</span>
    </Label>
    <Label htmlFor='custom-length' className={styles.label}>
      <Control onChange={onOriginChange} id='custom-length' checked={isSelected(TRACK_LENGTH_ORIGINS.customLength)} className={styles.radio} value={TRACK_LENGTH_ORIGINS.customLength} type='radio' name='track-length-method' />
      <span>Custom length</span>
      <div className={styles.rangeControls}>
        <LogarithmicSlider {...RANGE_INPUT_ATTRS} onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={origin !== TRACK_LENGTH_ORIGINS.customLength} className={`${styles.rangeSlider} ${origin !== TRACK_LENGTH_ORIGINS.customLength ? styles.disabled : ''}`} value={customLengthValue} onChange={onRangeInputChange} />
        <input {...RANGE_INPUT_ATTRS} onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={origin !== TRACK_LENGTH_ORIGINS.customLength} className={`${styles.rangeFreeformInput} ${origin !== TRACK_LENGTH_ORIGINS.customLength ? styles.disabled : ''}`} type='number' value={customLengthValue} name='range-freeform-input' onChange={({ target: { value } }) => onRangeInputChange(value)} />
      </div>
    </Label>
  </Form>;
};

const mapStatetoProps = ({ view: { trackLength }, data: { eventFilter, tracks } }) => ({
  trackLength,
  tracks,
  eventFilterTimeRange: eventFilter.filter.date_range,
});

export default connect(mapStatetoProps, { fetchTracks, setTrackLength, setTrackLengthRangeOrigin })(memo(TrackLengthControls));


TrackLengthControls.defaultProps = {
  virtualDate: null,
};


/*

  if (payload.origin === TRACK_LENGTH_ORIGINS.eventFilter) {
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