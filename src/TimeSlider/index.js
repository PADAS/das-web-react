import React, { memo, useState } from 'react';
import { connect } from 'react-redux';

import { setVirtualDate, clearVirtualDate } from '../ducks/timeslider';

const TimeSlider = (props) => {
  const { timeSliderState, since, until, clearVirtualDate, setVirtualDate } = props;
  const { virtualDate } = timeSliderState;
  const startDate = new Date(since);
  const endDate = until ? new Date(until) : new Date();
  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const value = (currentDate - startDate) / (endDate - startDate);

  const onRangeChange = ({ target: { value } }) => {
    if (value === 1) return clearVirtualDate();

    const dateValue = new Date(startDate);
    dateValue.setMilliseconds(dateValue.getMilliseconds() + ((endDate - startDate) * value));

    return setVirtualDate(new Date(dateValue).toISOString());
  };

  return <input style={{zIndex: 1000, width: '100%', position: 'absolute'}} type='range' min='0' max='1' step='any' onChange={onRangeChange} value={value} />
};

const mapStatetoProps = ({ view: { timeSliderState }, data: { eventFilter: { filter: { date_range } } } }) => ({
  timeSliderState,
  since: date_range.lower,
  until: date_range.upper,
});

export default connect(mapStatetoProps, { clearVirtualDate, setVirtualDate })(memo(TimeSlider));