import React, { memo, useCallback, useEffect, useState, forwardRef } from 'react';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';

import styles from './styles.module.scss';

const MIN_VALUE = 0;
const MAX_HOUR = 23;
const MAX_MINUTE = 59;

const NUMBER_INPUT_ATTRS = {
  type: 'number',
  pattern: '0-9]*',
  min: MIN_VALUE,
  step: 1,
};

const transformNumberStringToTwoDigitTimeValueString = (number, required) => {
  const val = number.toString();
  
  if (!val && required) return '00';

  if (val.length === 1) {
    return `0${val}`;
  }

  if (val.length === 3 && val.charAt(0) === '0') {
    return val.substring(1);
  }

  if (val === 'NaN') return '00';

  return val;
};

const TimeInput = (props, ref) => {
  const { className = '', disabled, onChange, value, required, showClear = false } = props;

  const [hourValue, setHourValue] = useState(required ? '00' : '');
  const [minuteValue, setMinuteValue] = useState(required ? '00' : '');

  const classString = `${styles.input} ${className}`;

  useEffect(() => {
    if (value) {
      let [hour, minute] = value
        .split(':')
        .map((item) => transformNumberStringToTwoDigitTimeValueString(item, required));
    
      setHourValue(hour);
      setMinuteValue(minute);
    } else {
      if (required) {
        setHourValue('00');
        setMinuteValue('00');
      } else {
        setHourValue('');
        setMinuteValue('');
      }
    }
  }, [required, value]);

  const inputRequired = (required) || (!!hourValue || !!minuteValue);

  
  const onHourChange = useCallback(({ target: { value } }) => {
    if (parseFloat(value) > MAX_HOUR) return;

    const hourString = transformNumberStringToTwoDigitTimeValueString(value, required);
    const minuteString = transformNumberStringToTwoDigitTimeValueString(minuteValue, required);
    
    onChange(`${hourString}:${minuteString}`);
  }, [minuteValue, onChange, required]);

  const onMinuteChange = useCallback(({ target: { value } }) => {
    if (parseFloat(value) > MAX_MINUTE) return;
    
    const minuteString = transformNumberStringToTwoDigitTimeValueString(value, required);
    const hourString = transformNumberStringToTwoDigitTimeValueString(hourValue, required);
    
    onChange(`${hourString}:${minuteString}`);
  }, [hourValue, onChange, required]);

  const canShowClear = showClear && (!!hourValue || !!minuteValue);

  const onClickClear = useCallback(() => {
    onChange(required ? '00:00' : '');
  }, [onChange, required]);
  
  return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-evenly'}}>
    <input ref={ref} required={inputRequired} disabled={disabled} className={classString} {...NUMBER_INPUT_ATTRS} value={hourValue} onChange={onHourChange} /><span>:</span><input disabled={disabled} required={inputRequired} className={classString} {...NUMBER_INPUT_ATTRS} value={minuteValue} onChange={onMinuteChange} />
    {canShowClear && <ClearIcon onClick={onClickClear} className={styles.clearIcon} />}
  </div>;
};

export default memo(forwardRef(TimeInput));