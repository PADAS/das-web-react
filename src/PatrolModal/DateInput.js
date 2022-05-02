import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import setSeconds from 'date-fns/set_seconds';
import isFuture from 'date-fns/is_future';

import DatePicker from '../DatePicker';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import styles from './styles.module.scss';

const PatrolDateInput = (props) => {
  const { autoCheckLabel = 'Automatic', defaultValue, onAutoCheckToggle, calcSubmitButtonTitle,
    isAuto = false, value, onChange, className, ...rest } = props;

  const [stateTime, setStateTime] = useState(value);
  const pickerRef = useRef(null);

  const canShowAutoCheck = useMemo(() =>
    Math.abs(differenceInMinutes(new Date(stateTime), new Date())) > 1
    && isFuture(new Date(stateTime)
    ), [stateTime]);

  const commitTimeChange = useCallback(() => {
    const auto = !canShowAutoCheck ? true : isAuto;

    onChange(stateTime, auto);
    pickerRef.current.setOpen(false);
  }, [canShowAutoCheck, isAuto, onChange, stateTime]);

  const onTimeChange = useCallback((val) => {
    setStateTime(
      !!val
        ? setSeconds(new Date(val), 0)
        : null
    );
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
    innerRef={pickerRef}
    showTimeInput
    className={timeClassName}
    value={stateTime}
    shouldCloseOnSelect={false}
    onChange={onTimeChange}
    onCalendarOpen={onPopoverOpened}
    onCalendarClose={onPopoverClosed}
    {...DATEPICKER_DEFAULT_CONFIG}
    {...rest}
    >
    <div className={styles.datePickerChildrenWrapper}>
      <div className={styles.datePickerChildren}>
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