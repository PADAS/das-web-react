import React, { memo, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import { format } from 'date-fns';
import TimeAgo from 'react-timeago';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import isEqual from 'react-fast-compare';

import { STANDARD_DATE_FORMAT } from '../utils/datetime';
import { setVirtualDate, clearVirtualDate } from '../ducks/timeslider';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { trackEvent } from '../utils/analytics';

import EventFilterDateRangeSelector from '../EventFilter/DateRange';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const { Title, Content } = Popover;

const TimeSlider = (props) => {
  const { timeSliderState, since, until, clearVirtualDate, setVirtualDate, updateEventFilter } = props;
  const [sliderPositionValue, setSliderPositionValue] = useState(100);
  const handleTextRef = useRef(null);
  const { virtualDate } = timeSliderState;
  const startDate = new Date(since);
  const endDate = until ? new Date(until) : new Date();
  
  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, { lower: since, upper: until });
  const clearDateRange = (e) => {
    e.stopPropagation();
    updateEventFilter({
      filter: {
        date_range: INITIAL_FILTER_STATE.filter.date_range,
      },
    });
    trackEvent('Feed', 'Click Reset Date Range Filter');
  };
  
  const value = (currentDate - startDate) / (endDate - startDate);
  const handleOffset = ((handleTextRef && handleTextRef.current && handleTextRef.current.offsetWidth) || 0) * value;

  const onHandleClick = (direction) => {
    trackEvent('Map Interaction', `Click '${direction} Time Slider Anchor'`);
  };

  const onRangeChange = ({ target: { value } }) => {
    // slight 'snap' at upper limit
    if (value >= .99999) {
      until ? setVirtualDate(until) : clearVirtualDate();
      setSliderPositionValue(100);
    } 
    else {
      
      setSliderPositionValue(value * 100);
      
      const dateValue = new Date(startDate);
      dateValue.setMilliseconds(dateValue.getMilliseconds() + ((endDate - startDate) * value));
      
      setVirtualDate(dateValue.toISOString());
    }

    trackEvent('Map Interaction', 'Changed \'Time Slider\'');
  };
  
  useEffect(() => {
    onRangeChange({ target: { value: 1 } });
    trackEvent('Map Interaction', 'Update Time Slider Date Range');
  }, [since, until]); // eslint-disable-line react-hooks/exhaustive-deps

  const PopoverContent = <Popover className={styles.popover}>
    <Title className={styles.popoverTitle}>
      <ClockIcon />
      Date Range
      <Button type="button" variant='light' size='sm' disabled={!dateRangeModified} onClick={clearDateRange}>Reset</Button>
    </Title>
    <Content className={styles.popoverBody}>
      <EventFilterDateRangeSelector endDateLabel='' startDateLabel='' className={styles.rangeControls} />
    </Content>
  </Popover>;

  return <div className={styles.wrapper}>
    <OverlayTrigger onClick={() => onHandleClick('Left')} shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={PopoverContent}>
      <div className={`${styles.handle} ${styles.left}`}>
        <span className={styles.handleDate}>{format(startDate, STANDARD_DATE_FORMAT)}</span>
        <TimeAgo date={startDate}/>
      </div>
    </OverlayTrigger>
    <div style={{position: 'relative', width: '100%'}}>
      <input className={styles.slider} type='range' min='0' max='1' step='any' onChange={onRangeChange} value={value} />
      <span ref={handleTextRef} className={styles.handleText} style={{left: `calc(${sliderPositionValue}% - ${handleOffset}px)`}}>
        <ClockIcon className={`${styles.icon} ${virtualDate ? styles.activeIcon : ''}`} />
        {(until || virtualDate) ? <span>{format(currentDate, STANDARD_DATE_FORMAT)}</span> : 'Timeslider'}
      </span>
    </div>
    <OverlayTrigger onClick={() => onHandleClick('Right')} shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={PopoverContent}>
      <div className={`${styles.handle} ${styles.right}`}>
        <span className={styles.handleDate}>{format(endDate, STANDARD_DATE_FORMAT)}</span>
        <button type='button'> {until ? <TimeAgo date={until}/> : 'Now'}</button>
      </div>
    </OverlayTrigger>
  </div>;
};

const mapStatetoProps = ({ view: { timeSliderState }, data: { eventFilter: { filter: { date_range } } } }) => ({
  timeSliderState,
  since: date_range.lower,
  until: date_range.upper,
});

export default connect(mapStatetoProps, { clearVirtualDate, setVirtualDate, updateEventFilter })(memo(TimeSlider));