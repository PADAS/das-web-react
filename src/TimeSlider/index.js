import React, { memo, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import format from 'date-fns/format';
import TimeAgo from '../TimeAgo';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import isEqual from 'react-fast-compare';

import { STANDARD_DATE_FORMAT, generateCurrentTimeZoneTitle, generateWeeksAgoDate, SHORTENED_DATE_FORMAT } from '../utils/datetime';
import { setVirtualDate, clearVirtualDate } from '../ducks/timeslider';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { trackEvent, debouncedTrackEvent } from '../utils/analytics';

import EventFilterDateRangeSelector from '../EventFilter/DateRange';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const { Title, Content } = Popover;

const TimeSlider = (props) => {
  const { timeSliderState, since, until, clearVirtualDate, setVirtualDate, updateEventFilter } = props;
  const [sliderPositionValue, setSliderPositionValue] = useState(100);
  const handleTextRef = useRef(null);
  const debouncedRangeChangeAnalytics = useRef(debouncedTrackEvent(300));
  const { virtualDate } = timeSliderState;
  const startDate = new Date(since);
  const endDate = until ? new Date(until) : new Date();

  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const startDateModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range.lower, since);
  const endDateModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range.upper, until);

  const dateRangeModified = startDateModified || endDateModified;

  const clearDateRange = (e) => {
    e.stopPropagation();
    updateEventFilter({
      filter: {
        date_range: INITIAL_FILTER_STATE.filter.date_range,
      },
    });
    onDateChange();
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


  };

  const onSliderChange = (event) => {
    onRangeChange(event);
    debouncedRangeChangeAnalytics.current('Map Interaction', 'Changed \'Time Slider\'');
  };

  const onDateChange = () => trackEvent('Map Interaction', 'Update Time Slider Date Range');

  const SetDateFormat = (dateTime) => {
    let twoWeekAgo = new Date(generateWeeksAgoDate(2));
    let DateTime = new Date(dateTime);

    if (DateTime >= twoWeekAgo){
      return format(DateTime, STANDARD_DATE_FORMAT);
    }
    return format(DateTime, SHORTENED_DATE_FORMAT);
  };

  useEffect(() => {
    onRangeChange({ target: { value: 1 } });
  }, [since, until]); // eslint-disable-line react-hooks/exhaustive-deps

  const PopoverContent = (props) => {
    console.log('content props', props);
    return <Popover {...props} className={styles.popover}>
      <Title className={styles.popoverTitle}>
        <ClockIcon />
      Date Range
        <Button type="button" variant='light' size='sm' disabled={!dateRangeModified} onClick={clearDateRange}>Reset</Button>
      </Title>
      <Content className={styles.popoverBody}>
        <EventFilterDateRangeSelector onStartChange={onDateChange} onEndChange={onDateChange} endDateLabel='' startDateLabel='' className={styles.rangeControls} popoverClassName={styles.dateRangePopover} placement='top' />
      </Content>
    </Popover>;
  };

  return <div className={styles.wrapper}>
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={PopoverContent} flip={true}>
      <div onClick={() => onHandleClick('Left')} className={`${styles.handle} ${styles.left} ${startDateModified ? styles.modified : ''}`}>
        <span className={styles.handleDate} title={generateCurrentTimeZoneTitle()}>{SetDateFormat(startDate)}</span>
        <TimeAgo date={startDate}/>
      </div>
    </OverlayTrigger>
    <div className={styles.wrapper_slider}>
      <input className={styles.slider} type='range' min='0' max='1' step='any' onChange={onSliderChange} value={value} />
      <span ref={handleTextRef} className={styles.handleText} style={{left: `calc(${sliderPositionValue}% - ${handleOffset}px)`}}>
        <ClockIcon className={`${styles.icon} ${virtualDate ? styles.activeIcon : ''}`} />
        {(until || virtualDate) ? <span>{format(currentDate, STANDARD_DATE_FORMAT)}</span> :
          <span style={{color: '#6d6d6d' }}>Timeslider</span>}
      </span>
    </div>
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' buttFace='totally' overlay={PopoverContent} flip={true}>
      <div onClick={() => onHandleClick('Right')} className={`${styles.handle} ${styles.right}  ${endDateModified ? styles.modified : ''}`}>
        {until && <span className={styles.handleDate} title={generateCurrentTimeZoneTitle()}>{SetDateFormat(endDate)}</span>}
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