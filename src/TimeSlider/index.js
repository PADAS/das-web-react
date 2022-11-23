import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import format from 'date-fns/format';
import TimeAgo from '../TimeAgo';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';

import { STANDARD_DATE_FORMAT, generateCurrentTimeZoneTitle, generateWeeksAgoDate, SHORTENED_DATE_FORMAT } from '../utils/datetime';
import { setVirtualDate, clearVirtualDate } from '../ducks/timeslider';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import EventFilterDateRangeSelector from '../EventFilter/DateRange';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const WINDOW_RESIZE_HANDLER_DEBOUNCE_DELAY = 300;
const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const TimeSlider = (props) => {
  const { sidebarOpen, timeSliderState, since, until, clearVirtualDate, setVirtualDate, resetGlobalDateRange } = props;

  const [sliderPositionValue, setSliderPositionValue] = useState(100);
  const handleTextRef = useRef(null);
  const leftPopoverTrigger = useRef(null);
  const rightPopoverTrigger = useRef(null);
  const debouncedRangeChangeAnalytics = useRef(mapInteractionTracker.debouncedTrack(300));
  const { virtualDate } = timeSliderState;
  const startDate = useMemo(() => new Date(since), [since]);
  const endDate = useMemo(() => until ? new Date(until) : new Date(), [until]);

  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const startDateModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range.lower, since);
  const endDateModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range.upper, until);

  const dateRangeModified = startDateModified || endDateModified;

  const clearDateRange = (e) => {
    e.stopPropagation();
    resetGlobalDateRange();
    onDateChange();
  };

  const value = (currentDate - startDate) / (endDate - startDate);
  const handleOffset = ((handleTextRef && handleTextRef.current && handleTextRef.current.offsetWidth) || 0) * value;

  const onHandleClick = (direction) => {
    mapInteractionTracker.track(`Click '${direction} Time Slider Anchor'`);
  };

  const onRangeChange = useCallback(({ target: { value } }) => {
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


  }, [clearVirtualDate, endDate, setVirtualDate, startDate, until]);

  const onSliderChange = (event) => {
    onRangeChange(event);
    debouncedRangeChangeAnalytics.current('Changed \'Time Slider\'');
  };

  const onDateChange = () => mapInteractionTracker.track('Update Time Slider Date Range');

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

  useEffect(() => {
    const handleResize = () => {
      onRangeChange({ target: { value } });
    };

    const debouncedHandler = debounce(handleResize, WINDOW_RESIZE_HANDLER_DEBOUNCE_DELAY);

    window.addEventListener('resize', debouncedHandler);
    return () => {
      window.removeEventListener('resize', debouncedHandler);
    };
  }, [onRangeChange, value]);

  const PopoverContent = ({ popoverClassName, ...rest }) => {
    return <Popover {...rest} className={`${styles.popover} ${props.className}`}>
      <Popover.Header className={styles.popoverTitle}>
        <ClockIcon />
        Date Range
        <Button type="button" variant='light' size='sm' disabled={!dateRangeModified} onClick={clearDateRange}>Reset</Button>
      </Popover.Header>
      <Popover.Body className={styles.popoverBody}>
        <EventFilterDateRangeSelector
          onStartChange={onDateChange}
          onEndChange={onDateChange}
          endDateLabel=''
          startDateLabel=''
          popoverClassName={`${styles.dateRangePopover} ${popoverClassName || ''} ${sidebarOpen ? '' : styles.sidebarClosed}`}
          placement='top'
          />
      </Popover.Body>
    </Popover>;
  };

  const RightPopoverContent = (props) => PopoverContent({ ...props, popoverClassName: styles.rightPopover });

  const sidebarOpenStyles = styles.sidebarOpen;

  return <div
    className={`${styles.wrapper} ${sidebarOpen ? sidebarOpenStyles : styles.sidebarClosed}`}
    >
    <OverlayTrigger target={leftPopoverTrigger.current} shouldUpdatePosition={true} rootClose trigger='click' placement='top' overlay={PopoverContent} flip={true}>
      <div ref={leftPopoverTrigger} onClick={() => onHandleClick('Left')} className={`${styles.handle} ${styles.left} ${startDateModified ? styles.modified : ''}`}>
        <span className={styles.handleDate} title={generateCurrentTimeZoneTitle()}>{SetDateFormat(startDate)}</span>
        <TimeAgo date={startDate}/>
      </div>
    </OverlayTrigger>
    <div className={styles.wrapper_slider}>
      <input className={styles.slider} type='range' min='0' max='1' step='any' onChange={onSliderChange} value={value} />
      <span ref={handleTextRef} className={styles.handleText} style={{ left: `calc(${sliderPositionValue}% - ${handleOffset}px)` }}>
        <ClockIcon className={`${styles.icon} ${virtualDate ? styles.activeIcon : ''}`} />
        {(until || virtualDate) ? <span>{format(currentDate, STANDARD_DATE_FORMAT)}</span> :
        <span style={{ color: '#6d6d6d' }}>Timeslider</span>}
      </span>
    </div>
    <OverlayTrigger target={rightPopoverTrigger.current} shouldUpdatePosition={true} rootClose trigger='click' placement='top' overlay={RightPopoverContent} flip={true}>
      <div ref={rightPopoverTrigger} onClick={() => onHandleClick('Right')} className={`${styles.handle} ${styles.right}  ${endDateModified ? styles.modified : ''}`}>
        {until && <span className={styles.handleDate} title={generateCurrentTimeZoneTitle()}>{SetDateFormat(endDate)}</span>}
        <button type='button'> {until ? <TimeAgo date={until}/> : 'Now'}</button>
      </div>
    </OverlayTrigger>
  </div>;
};

const mapStatetoProps = ({ view: { timeSliderState, userPreferences }, data: { eventFilter: { filter: { date_range } } } }) => ({
  sidebarOpen: userPreferences.sidebarOpen,
  timeSliderState,
  since: date_range.lower,
  until: date_range.upper,
});

export default connect(mapStatetoProps, { clearVirtualDate, resetGlobalDateRange, setVirtualDate })(memo(TimeSlider));