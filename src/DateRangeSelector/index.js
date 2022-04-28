import React, { memo, useCallback, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import endOfDay from 'date-fns/end_of_day';
import subSeconds from 'date-fns/sub_seconds';

import DatePicker from '../DatePicker';
import FilterSettingsControl from '../FilterSettingsControl';

import styles from './styles.module.scss';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { generateMonthsAgoDate, generateDaysAgoDate, generateWeeksAgoDate } from '../utils/datetime';

import DateRangeSelectionString from './DateRangeSelectionString';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const DateRangeSelector = (props) => {
  const { startDate, endDate, endMaxDate, onStartDateChange, onEndDateChange, onClickDateRangePreset,
    startDateLabel, endDateLabel, onFilterSettingsToggle, maxDate, requireStart, requireEnd, showPresets, isAtDefault = false,
    defaultFriendlyString, startDateNullMessage, endDateNullMessage, className, popoverClassName,
    children, placement, filterSettings, endDateLabelClass = '', startDateLabelClass = '', ...rest } = props;

  const showStartNullMessage = !requireStart && !startDate && !!startDateNullMessage;
  const showEndNullMessage = !requireEnd && !endDate && !!endDateNullMessage;

  const endDateDayClicked = useRef(false);
  const settingsButtonRef = useRef(null);
  const popoverRef = useRef(null);
  const containerRef = useRef(null);

  const [filterSettingsOpen, setFilterSettingsPopoverState] = useState(false);

  const hideFilterSettings = () => {
    if (filterSettingsOpen) setFilterSettingsPopoverState(false);
  };

  const toggleFilterSettingsPopover = useCallback(() => {
    setFilterSettingsPopoverState(!filterSettingsOpen);
    onFilterSettingsToggle && onFilterSettingsToggle(!filterSettingsOpen);
  }, [filterSettingsOpen, onFilterSettingsToggle]);

  const hasEndMaxDate = typeof endMaxDate !== 'undefined';

  const handleEndDateChange = (val) => {
    if (endDateDayClicked.current) {
      endDateDayClicked.current = false;
      return onEndDateChange(endOfDay(val));
    }
    return onEndDateChange(val);
  };

  const handleEndDateDayClick = () => {
    endDateDayClicked.current = true;
  };

  return <div className={className || '' } ref={containerRef}>
    <div  className={styles.currentSelectedRange}>
      { (!!isAtDefault && !!defaultFriendlyString)
        ? <span className={styles.rangeString}>
          <strong>{defaultFriendlyString}</strong>
        </span>
        : <DateRangeSelectionString className={styles.rangeString} startDate={startDate} endDate={endDate} />
      }
    </div>
    <div className={startDateLabel ? styles.dateSelectorWrapper : styles.dateSelectorWrapperInline}>
      <label data-testid='dateRangeSelector-startLabel' className={`${styles.label} ${startDateLabelClass}`}>
        {startDateLabel && <span>{startDateLabel}</span>}
        <span onClick={hideFilterSettings}>
          {showStartNullMessage && !endDate && <span className={styles.nullMessage}>{startDateNullMessage}</span>}
          <DatePicker
            placement={placement}
            required={true}
            maxDate={endDate ? endDate : maxDate}
            value={startDate}
            onChange={onStartDateChange}
            className={styles.dateInput}
            calendarClassName={`${styles.datePopover}
            ${popoverClassName || ''}`}
            {...DATEPICKER_DEFAULT_CONFIG}
            {...rest}
          />
        </span>
      </label>
      <span className={styles.dateRangeArrow}>⇨</span>
      {children}
      <label data-testid='dateRangeSelector-endLabel' className={`${styles.label} ${endDateLabelClass}`}>
        {endDateLabel && <span>{endDateLabel}</span>}
        <span onClick={hideFilterSettings}>
          {showEndNullMessage && <span className={styles.nullMessage}>{endDateNullMessage}</span>}
          <DatePicker
            placement={placement}
            onClickDay={handleEndDateDayClick}
            className={styles.dateInput}
            calendarClassName={`${styles.datePopover}
            ${popoverClassName || ''}`}
            required={requireEnd}
            minDate={startDate}
            maxDate={hasEndMaxDate ? endMaxDate : maxDate}
            value={endDate}
            onChange={handleEndDateChange}
            {...DATEPICKER_DEFAULT_CONFIG}
            {...rest}
          />
        </span>
      </label>
    </div>

    {showPresets && <div className={styles.presets}>
      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateDaysAgoDate(0),
        upper: null,
      }, 'today')}>Today</Button>

      <Button variant='link' data-testid='yesterday-btn' onClick={() => onClickDateRangePreset({
        lower: generateDaysAgoDate(1),
        upper: subSeconds(generateDaysAgoDate(0), 1),
      }, 'yesterday')}>Yesterday</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateWeeksAgoDate(1),
        upper: null,
      }, 'last week')}>Last 7 days</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateDaysAgoDate(30),
        upper: null,
      }, 'last 30 days')}>Last 30 days</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateMonthsAgoDate(3),
        upper: null,
      }, 'last three months')}>Last three months</Button>
    </div>}
    {!!filterSettings && <div>
      <button
        type='button'
        className={styles.gearButton}
        ref={settingsButtonRef}
        onClick={toggleFilterSettingsPopover}
        data-testid='settings-gear-icon'
        >
        <GearIcon />
      </button>
      <FilterSettingsControl ref={popoverRef} isOpen={filterSettingsOpen} target={settingsButtonRef} hideFilterSettings={hideFilterSettings}
        container={containerRef} popoverClassName={`${styles.datePopover} ${popoverClassName || ''}`}>
        {filterSettings}
      </FilterSettingsControl>
    </div>}
  </div>;
};

DateRangeSelector.defaultProps = {
  endDateLabel: 'To:',
  maxDate: new Date(),
  requireStart: false,
  requireEnd: false,
  startDateLabel: 'From:',
  format: 'yyyy-MM-dd HH:mm',
  onClickDateRangePreset: () => null,
  showPresets: false,
};

DateRangeSelector.propTypes = {
  endDate: PropTypes.instanceOf(Date),
  endDateLabel: PropTypes.string,
  endDateLabelClass: PropTypes.string,
  endDateNullMessage: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date),
  onEndDateChange: PropTypes.func.isRequired,
  onStartDateChange: PropTypes.func.isRequired,
  onClickDateRangePreset: PropTypes.func,
  requireStart: PropTypes.bool,
  requireEnd: PropTypes.bool,
  showPresets: PropTypes.bool,
  startDate: PropTypes.instanceOf(Date),
  startDateLabel: PropTypes.string,
  startDateLabelClass: PropTypes.string,
  startDateNullMessage: PropTypes.string,
};

export default memo(DateRangeSelector);
