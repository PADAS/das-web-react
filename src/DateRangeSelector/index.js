import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { isValid, parseISO, subSeconds } from 'date-fns';

import DateTimePicker, { EMPTY_DATE_TIME_VALUE } from '../DateTimePicker';
import FilterSettingsControl from '../FilterSettingsControl';

import styles from './styles.module.scss';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import {
  formatDateToLocalISO,
  generateMonthsAgoDate,
  generateDaysAgoDate,
  generateWeeksAgoDate,
} from '../utils/datetime';

import DateRangeSelectionString from './DateRangeSelectionString';

import { useTranslation } from 'react-i18next';

const DateRangeSelector = ({
  startDate,
  endDate,
  endMaxDate,
  onStartDateChange,
  onEndDateChange,
  onClickDateRangePreset,
  onFilterSettingsToggle,
  maxDate,
  requireStart,
  requireEnd,
  showPresets,
  isAtDefault = false,
  defaultFriendlyString,
  startDateNullMessage,
  endDateNullMessage,
  className,
  popoverClassName,
  placement,
  filterSettings,
  endDateLabelClass = '',
  startDateLabelClass = '',
  ...rest
}) => {
  const { t } = useTranslation('filters', { keyPrefix: 'dateRangeSelector' });
  const {
    startDateLabel = t('startDateLabel'),
    endDateLabel = t('endDateLabel')
  } = rest;

  const showStartNullMessage = !requireStart && !startDate && !!startDateNullMessage;
  const showEndNullMessage = !requireEnd && !endDate && !!endDateNullMessage;

  const settingsButtonRef = useRef(null);
  const popoverRef = useRef(null);
  const containerRef = useRef(null);

  const [filterSettingsOpen, setFilterSettingsPopoverState] = useState(false);
  const [endDateTime, setEndDateTime] = useState(endDate ? formatDateToLocalISO(endDate) : EMPTY_DATE_TIME_VALUE);
  const [startDateTime, setStartDateTime] = useState(startDate
    ? formatDateToLocalISO(startDate)
    : EMPTY_DATE_TIME_VALUE);

  const hideFilterSettings = () => {
    if (filterSettingsOpen) setFilterSettingsPopoverState(false);
  };

  const toggleFilterSettingsPopover = useCallback(() => {
    setFilterSettingsPopoverState(!filterSettingsOpen);
    onFilterSettingsToggle && onFilterSettingsToggle(!filterSettingsOpen);
  }, [filterSettingsOpen, onFilterSettingsToggle]);

  const onStartDateTimePickerChange = (dateTime) => {
    setStartDateTime(dateTime);

    const parsedDateTime = parseISO(dateTime);
    if (isValid(parsedDateTime)) {
      onStartDateChange(parsedDateTime);
    }
  };

  const onEndDateTimePickerChange = (dateTime) => {
    setEndDateTime(dateTime);

    const parsedDateTime = parseISO(dateTime);
    if (isValid(parsedDateTime)) {
      onEndDateChange(parsedDateTime);
    }
  };

  const onDateRangePresetButtonClick = (lower, upper, label) => {
    onClickDateRangePreset({ lower, upper }, label);

    if (!upper) {
      setEndDateTime(EMPTY_DATE_TIME_VALUE);
    }
  };

  useEffect(() => {
    setStartDateTime(startDate ? formatDateToLocalISO(startDate) : EMPTY_DATE_TIME_VALUE);
  }, [startDate]);

  useEffect(() => {
    setEndDateTime(endDate ? formatDateToLocalISO(endDate) : EMPTY_DATE_TIME_VALUE);
  }, [endDate]);

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
          <DateTimePicker
            datePickerProps={{
              reactDatePickerProps: {
                popperClassName: popoverClassName || '',
                popperPlacement: placement,
              },
            }}
            max={formatDateToLocalISO(endDate || maxDate)}
            min={formatDateToLocalISO(new Date('2000-01-01'))}
            onChange={onStartDateTimePickerChange}
            required
            value={startDateTime}
          />
          {showStartNullMessage && !endDate && <span className={styles.nullMessage}>{startDateNullMessage}</span>}
        </span>
      </label>

      <label data-testid='dateRangeSelector-endLabel' className={`${styles.label} ${endDateLabelClass}`}>
        {endDateLabel && <span>{endDateLabel}</span>}
        <span onClick={hideFilterSettings}>
          <DateTimePicker
            datePickerProps={{
              reactDatePickerProps: {
                popperClassName: popoverClassName || '',
                popperPlacement: placement,
              },
            }}
            max={endMaxDate === null ? undefined : formatDateToLocalISO(endMaxDate || maxDate)}
            min={formatDateToLocalISO(startDate || new Date('2000-01-01'))}
            onChange={onEndDateTimePickerChange}
            required={requireEnd}
            value={endDateTime}
          />
          {showEndNullMessage && <span className={styles.nullMessage}>{endDateNullMessage}</span>}
        </span>
      </label>
    </div>

    {showPresets && <div className={styles.presets}>
      <Button onClick={() => onDateRangePresetButtonClick(generateDaysAgoDate(0), null, 'today')} variant="link">
        {t('todayLabel')}
      </Button>

      <Button
        data-testid="yesterday-btn"
        onClick={() => onDateRangePresetButtonClick(
          generateDaysAgoDate(1),
          subSeconds(generateDaysAgoDate(0), 1),
          'yesterday'
        )}
        variant="link"
      >
        {t('yesterdayLabel')}
      </Button>

      <Button onClick={() => onDateRangePresetButtonClick(generateWeeksAgoDate(1), null, 'last week')} variant="link">
        {t('lastSevenDaysLabel')}
      </Button>

      <Button
        onClick={() => onDateRangePresetButtonClick(generateDaysAgoDate(30), null, 'last 30 days')}
        variant="link"
      >
        {t('lastThirtyDaysLabel')}
      </Button>

      <Button
        onClick={() => onDateRangePresetButtonClick(generateMonthsAgoDate(3), null, 'last three months')}
        variant="link"
      >
        {t('lastThreeMonthsLabel')}
      </Button>
    </div>}
    {!!filterSettings && <div>
      <button
        type='button'
        className={styles.gearButton}
        ref={settingsButtonRef}
        onClick={toggleFilterSettingsPopover}
        data-testid='settings-gear-icon'
        >
        <GearIcon title={t('settingsTitle')} />
      </button>
      <FilterSettingsControl ref={popoverRef} isOpen={filterSettingsOpen} target={settingsButtonRef} hideFilterSettings={hideFilterSettings}
        container={containerRef} popoverClassName={`${styles.datePopover} ${popoverClassName || ''}`}>
        {filterSettings}
      </FilterSettingsControl>
    </div>}
  </div>;
};

DateRangeSelector.defaultProps = {
  maxDate: new Date(),
  requireStart: false,
  requireEnd: false,
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
