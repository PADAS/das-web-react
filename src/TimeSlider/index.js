import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { format } from 'date-fns';
import TimeAgo from 'react-timeago';

import { STANDARD_DATE_FORMAT } from '../utils/datetime';
import { setVirtualDate, clearVirtualDate } from '../ducks/timeslider';

import EventFilterDateRangeSelector from '../EventFilter/DateRange';

import styles from './styles.module.scss';

const TimeSlider = (props) => {
  const { timeSliderState, since, until, clearVirtualDate, setVirtualDate } = props;
  const { virtualDate } = timeSliderState;
  const startDate = new Date(since);
  const endDate = until ? new Date(until) : new Date();
  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const value = (currentDate - startDate) / (endDate - startDate);

  const onRangeChange = ({ target: { value } }) => {
    // slight 'snap' at upper limit
    if (value >= .99999) return until ? setVirtualDate(until) : clearVirtualDate();

    const dateValue = new Date(startDate);
    dateValue.setMilliseconds(dateValue.getMilliseconds() + ((endDate - startDate) * value));

    return setVirtualDate(dateValue.toISOString());
  };

  useEffect(() => {
    onRangeChange({ target: { value: 1 } });
  }, [since, until]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={styles.wrapper}>
    <EventFilterDateRangeSelector className={styles.rangeControls} showPresets={false} style={{zIndex: 1000, width: '100%', position: 'absolute'}}>
      <input className={styles.slider} type='range' min='0' max='1' step='any' onChange={onRangeChange} value={value} />
    </EventFilterDateRangeSelector>
    {(until || virtualDate) ?  <TimeAgo date={currentDate} /> : <span>Timeslider</span>}
    <span>{format(currentDate, STANDARD_DATE_FORMAT)}</span>
  </div>;
};

const mapStatetoProps = ({ view: { timeSliderState }, data: { eventFilter: { filter: { date_range } } } }) => ({
  timeSliderState,
  since: date_range.lower,
  until: date_range.upper,
});

export default connect(mapStatetoProps, { clearVirtualDate, setVirtualDate })(memo(TimeSlider));