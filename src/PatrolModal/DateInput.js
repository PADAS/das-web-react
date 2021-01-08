import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import setSeconds from 'date-fns/set_seconds';
import isFuture from 'date-fns/is_future';

import DateTimePickerPopover from '../DateTimePickerPopover';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import styles from './styles.module.scss';

const PatrolDateInput = (props) => {
  const { autoCheckLabel = 'Automatic', defaultValue, onAutoCheckToggle, calcSubmitButtonTitle, children,
    isAuto = false, title, value, onChange, className, ...rest } = props;

  const [stateTime, setStateTime] = useState(value);
  const [tempPopoverProps, setTempPopoverProps] = useState({});


  const onHide = useCallback(() => {
    setStateTime(value);
  }, [value]);

  const canShowAutoCheck = useMemo(() =>
    Math.abs(differenceInMinutes(new Date(stateTime), new Date())) > 1
    && isFuture(new Date(stateTime)
    ), [stateTime]);

  const commitTimeChange = useCallback(() => {
    const auto = !canShowAutoCheck ? true : isAuto;
    
    onChange(stateTime, auto);

    setTempPopoverProps({ popoverOpen: false });
    setTimeout(() => setTempPopoverProps({}), 1000);
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
      string += ` ${styles.empty }`;
    }

    if (timeBeingEdited) {
      string += ` ${styles.editingDate}`;
    }

    if (className) {
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

  return <DateTimePickerPopover
    {...DATEPICKER_DEFAULT_CONFIG}
    value={stateTime} 
    className={timeClassName} 
    {...tempPopoverProps} 
    onHide={onHide} 
    onEnterKeyPress={commitTimeChange}
    onPopoverClosed={onPopoverClosed}
    onPopoverOpened={onPopoverOpened}
    onChange={onTimeChange}
    {...rest}
  >  
    <div className={styles.dateTimePickerChildren}>
      <Button variant='primary' type='button' onClick={commitTimeChange}>
        {buttonTitle}
      </Button>
      {canShowAutoCheck && <label htmlFor='autoStart'>
        <input checked={isAuto} onChange={() => onAutoCheckToggle(!isAuto)} type='checkbox' id='autoStart' /> {autoCheckLabel}
      </label>}
    </div>
  </DateTimePickerPopover>;
 
};

export default memo(PatrolDateInput);