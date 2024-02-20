import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import { clearVirtualDate, setVirtualDate } from '../ducks/timeslider';
import { DATE_LOCALES } from '../constants';
import {
  generateCurrentTimeZoneTitle,
  generateWeeksAgoDate,
  SHORTENED_DATE_FORMAT,
  STANDARD_DATE_FORMAT,
  format
} from '../utils/datetime';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';

import EventFilterDateRangeSelector from '../EventFilter/DateRange';
import TimeAgo from '../TimeAgo';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const WINDOW_RESIZE_HANDLER_DEBOUNCE_DELAY = 300;

const TimeSlider = ({ className }) => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation('components', { keyPrefix: 'timeSlider' });

  const sidebarOpen = useSelector((state) => state.view.userPreferences.sidebarOpen);
  const since = useSelector((state) => state.data.eventFilter.filter.date_range.lower);
  const timeSliderState = useSelector((state) => state.view.timeSliderState);
  const until = useSelector((state) => state.data.eventFilter.filter.date_range.upper);

  const debouncedRangeChangeAnalytics = useRef(mapInteractionTracker.debouncedTrack(300));
  const handleTextRef = useRef(null);
  const leftPopoverTrigger = useRef(null);
  const rightPopoverTrigger = useRef(null);

  const [sliderPositionValue, setSliderPositionValue] = useState(100);

  const { virtualDate } = timeSliderState;

  const startDate = useMemo(() => new Date(since), [since]);
  const endDate = useMemo(() => until ? new Date(until) : new Date(), [until]);

  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const startDateModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range.lower, since);
  const endDateModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range.upper, until);

  const dateRangeModified = startDateModified || endDateModified;

  const value = (currentDate - startDate) / (endDate - startDate);
  const handleOffset = ((handleTextRef && handleTextRef.current && handleTextRef.current.offsetWidth) || 0) * value;

  const onDateChange = () => mapInteractionTracker.track('Update Time Slider Date Range');

  const clearDateRange = (event) => {
    event.stopPropagation();

    dispatch(resetGlobalDateRange());
    onDateChange();
  };

  const onHandleClick = (direction) => mapInteractionTracker.track(`Click '${direction} Time Slider Anchor'`);

  const onRangeChange = useCallback((event) => {
    // slight 'snap' at upper limit
    if (event.target.value >= .99999) {
      if (until) {
        dispatch(setVirtualDate(until));
      } else {
        dispatch(clearVirtualDate());
      }

      setSliderPositionValue(100);
    } else {
      setSliderPositionValue(event.target.value * 100);

      const dateValue = new Date(startDate);
      dateValue.setMilliseconds(dateValue.getMilliseconds() + ((endDate - startDate) * event.target.value));
      dispatch(setVirtualDate(dateValue.toISOString()));
    }
  }, [dispatch, endDate, startDate, until]);

  const onSliderChange = (event) => {
    onRangeChange(event);

    debouncedRangeChangeAnalytics.current('Changed \'Time Slider\'');
  };

  const setDateFormat = (dateTime) => {
    const twoWeekAgo = new Date(generateWeeksAgoDate(2));
    const DateTime = new Date(dateTime);
    if (DateTime >= twoWeekAgo){
      return format(DateTime, STANDARD_DATE_FORMAT, { locale: DATE_LOCALES[i18n.language] });
    }
    return format(DateTime, SHORTENED_DATE_FORMAT, { locale: DATE_LOCALES[i18n.language] });
  };

  useEffect(() => {
    onRangeChange({ target: { value: 1 } });
  }, [since, until]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => onRangeChange({ target: { value } });

    const debouncedHandler = debounce(handleResize, WINDOW_RESIZE_HANDLER_DEBOUNCE_DELAY);

    window.addEventListener('resize', debouncedHandler);

    return () => window.removeEventListener('resize', debouncedHandler);
  }, [onRangeChange, value]);

  const PopoverContent = ({ popoverClassName, ...rest }) => <Popover
      {...rest}
      className={`${styles.popover} ${className}`}
    >
    <Popover.Header className={styles.popoverTitle}>
      <ClockIcon />

      {t('popoverHeader')}

      <Button
        disabled={!dateRangeModified}
        onClick={clearDateRange}
        size="sm"
        type="button"
        variant="light"
      >
        {t('popoverResetButton')}
      </Button>
    </Popover.Header>

    <Popover.Body className={styles.popoverBody}>
      <EventFilterDateRangeSelector
        onStartChange={onDateChange}
        onEndChange={onDateChange}
        endDateLabel=""
        startDateLabel=""
        popoverClassName={`${styles.dateRangePopover} ${popoverClassName || ''} ${sidebarOpen ? '' : styles.sidebarClosed}`}
        placement="top"
      />
    </Popover.Body>
  </Popover>;

  const RightPopoverContent = (props) => PopoverContent({ ...props, popoverClassName: styles.rightPopover });

  return <div className={`${styles.wrapper} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
    <OverlayTrigger
      flip
      overlay={PopoverContent}
      placement="top"
      rootClose
      shouldUpdatePosition
      target={leftPopoverTrigger.current}
      trigger="click"
    >
      <div
        className={`${styles.handle} ${styles.left} ${startDateModified ? styles.modified : ''}`}
        onClick={() => onHandleClick('Left')}
        ref={leftPopoverTrigger}
      >
        <span className={styles.handleDate} title={generateCurrentTimeZoneTitle()}>{setDateFormat(startDate)}</span>

        <TimeAgo date={startDate}/>
      </div>
    </OverlayTrigger>

    <div className={styles.wrapper_slider}>
      <input
        className={styles.slider}
        max="1"
        min="0"
        onChange={onSliderChange}
        step="any"
        type="range"
        value={value}
      />

      <span
        className={styles.handleText}
        ref={handleTextRef}
        style={{ left: `calc(${sliderPositionValue}% - ${handleOffset}px)` }}
      >
        <ClockIcon className={`${styles.icon} ${virtualDate ? styles.activeIcon : ''}`} />

        {(until || virtualDate)
          ? <span>{format(currentDate, STANDARD_DATE_FORMAT, { locale: DATE_LOCALES[i18n.language] })}</span>
          : <span style={{ color: '#6d6d6d' }}>{t('slider')}</span>}
      </span>
    </div>

    <OverlayTrigger
      flip
      overlay={RightPopoverContent}
      placement="top"
      rootClose
      shouldUpdatePosition
      target={rightPopoverTrigger.current}
      trigger="click"
    >
      <div
        className={`${styles.handle} ${styles.right} ${endDateModified ? styles.modified : ''}`}
        onClick={() => onHandleClick('Right')}
        ref={rightPopoverTrigger}
      >
        {until && <span className={styles.handleDate} title={generateCurrentTimeZoneTitle()}>{setDateFormat(endDate)}</span>}

        <button type="button"> {until ? <TimeAgo date={until}/> : t('untilNowButton')}</button>
      </div>
    </OverlayTrigger>
  </div>;
};

export default memo(TimeSlider);
