import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import setSeconds from 'date-fns/set_seconds';
import isFuture from 'date-fns/is_future';

import DatePicker from '../DatePicker';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import styles from './styles.module.scss';

const PatrolDateInput = (props) => {
  const { autoCheckLabel = 'Automatic', defaultValue, onAutoCheckToggle, calcSubmitButtonTitle,
    isAuto = false, value, onChange, className, ...rest } = props;

  const DateInputRef = useRef(null);
  const [stateTime, setStateTime] = useState(value);
  const [tempPopoverProps, setTempPopoverProps] = useState({});

  const canShowAutoCheck = useMemo(() =>
    Math.abs(differenceInMinutes(new Date(stateTime), new Date())) > 1
    && isFuture(new Date(stateTime)
    ), [stateTime]);

  const commitTimeChange = useCallback(() => {
    const auto = !canShowAutoCheck ? true : isAuto;

    onChange(stateTime, auto);
    DateInputRef.current.setOpen(false);
    setTempPopoverProps({ popoverOpen: false });
    setTimeout(() => setTempPopoverProps({}), 1000);
  }, [canShowAutoCheck, isAuto, onChange, stateTime]);

  const onTimeChange = useCallback((val) => {
    console.log('%c onTimeChange', 'font-size:24px;color:red;', val);
    console.log('%c stateTime', 'font-size:24px;color:red;', stateTime);
    setStateTime(
      !!val
        ? setSeconds(new Date(val), 0)
        : null
    );
    console.log('%c stateTime', 'font-size:24px;color:red;', stateTime);
  }, []);

  const buttonTitle = useMemo(() =>
    calcSubmitButtonTitle(value, stateTime)
  , [calcSubmitButtonTitle, stateTime, value]);

  const timeBeingEdited = useMemo(() => new Date(stateTime).getTime() !== new Date(value).getTime(), [stateTime, value]);

  const timeClassName = useMemo(() => {
    let string = styles.timeInput;

    if (!value) {
      string += ' empty';
    }

    if (timeBeingEdited) {
      string += ` ${styles.editingDate}`;
    }

    if (!!className) {
      string += ` ${className}`;
    }

    console.log('%c string', 'font-size:20px;Color:purple;', string);

    return string;
  }, [className, timeBeingEdited, value]);

  useEffect(() => {
    setStateTime(value);
  }, [value]);

  const onPopoverOpened = useCallback(() => {
    if (!value && !!defaultValue) {
      setStateTime(defaultValue);
    }
  }, [defaultValue, value]);

  const onPopoverClosed = useCallback(() => {
    if (!value) {
      setStateTime(value);
    }
  }, [value]);

  return <DatePicker
    ref={DateInputRef}
    showTimeInput
    className={timeClassName}
    value={stateTime}
    {...tempPopoverProps}
    shouldCloseOnSelect={false}
    onChange={onTimeChange}
    onCalendarOpen={onPopoverOpened}
    onCalendarClose={onPopoverClosed}
    calendarIcon={ClockIcon}
    {...DATEPICKER_DEFAULT_CONFIG}
    {...rest}
    >
    <div className={styles.dateTimePickerChildrenWrapper}>
      <div className={styles.dateTimePickerChildren}>
        <Button variant='primary' type='button' onClick={commitTimeChange}>
          {buttonTitle}
        </Button>
        <label htmlFor='autoStart' style={!canShowAutoCheck ? { visibility: 'hidden' } : {}}>
          <input checked={isAuto} onChange={() => onAutoCheckToggle(!isAuto)} type='checkbox' id='autoStart' /> {autoCheckLabel}
        </label>
      </div>
    </div>
  </DatePicker>;
};

export default memo(PatrolDateInput);