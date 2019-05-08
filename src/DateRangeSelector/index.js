import React, { memo } from 'react';
import uuid from 'uuid';
import PropTypes from 'prop-types';

import DateTimePicker from 'react-datetime-picker';

const DATEPICKER_CONFIG = {
  disableClock: true,
  format: 'dd-MM-yy HH:mm',
};

const DateRangeSelector = (props) => {
  const { startDate, endDate, onStartDateChange, onEndDateChange, startDateLabel, endDateLabel, maxDate, ...rest } = props;
  const startID = `startDate-${uuid()}`;
  const endID = `endDate-${uuid()}`;

  return <div {...rest}>
    <label htmlFor={startID}>
      <span>{startDateLabel}</span>
      <DateTimePicker required maxDate={maxDate} id={startID} {...DATEPICKER_CONFIG} value={startDate} onChange={onStartDateChange} />
    </label>
    <label htmlFor={endID}>
      <span>{endDateLabel}</span>
      <DateTimePicker required minDate={startDate} maxDate={maxDate} id={endID} {...DATEPICKER_CONFIG} value={endDate} onChange={onEndDateChange} />
    </label>
  </div>;
};

DateRangeSelector.defaultProps = {
  endDateLabel: 'To:',
  maxDate: new Date(),
  startDateLabel: 'From:',
};

DateRangeSelector.propTypes = {
  endDate: PropTypes.instanceOf(Date),
  endDateLabel: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date),
  onEndDateChange: PropTypes.func.isRequired,
  onStartDateChange: PropTypes.func.isRequired,
  startDate: PropTypes.instanceOf(Date),
  startDateLabel: PropTypes.string,
};

export default memo(DateRangeSelector);