import React, { memo, useCallback, useEffect, useState, forwardRef } from 'react';

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

const numberToTimeString = (value) => {
  if (!value) return '00';

  const asString = value.toString();

  return asString.length > 1 ? asString : `0${asString}`;
};

const TimeInput = (props, ref) => {
  const { disabled, onChange, value } = props;

  const [hourValue, setHourValue] = useState('00');
  const [minuteValue, setMinuteValue] = useState('00');

  useEffect(() => {
    let [hour, minute] = value.split(':');

    if (hour.length === 1) {
      hour = `0${hour}`;
    }

    if (minute.length === 1) {
      minute = `0${minute}`;
    }

    setHourValue(hour);
    setMinuteValue(minute);
  }, [value]);


  const onHourChange = useCallback(({ target: { value } }) => {
    if (parseFloat(value) > MAX_HOUR) return;

    const hourString = numberToTimeString(value);
    const minuteString = numberToTimeString(minuteValue);

    onChange(`${hourString}:${minuteString}`);
  }, [minuteValue, onChange]);

  const onMinuteChange = useCallback(({ target: { value } }) => {
    if (parseFloat(value) > MAX_MINUTE) return;

    const minuteString = numberToTimeString(value);
    const hourString = numberToTimeString(hourValue);

    onChange(`${hourString}:${minuteString}`);
  }, [hourValue, onChange]);

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
    <input ref={ref} disabled={disabled} className={styles.input} {...NUMBER_INPUT_ATTRS} value={hourValue} onChange={onHourChange} />:<input disabled={disabled} className={styles.input} {...NUMBER_INPUT_ATTRS} value={minuteValue} onChange={onMinuteChange} />
  </div>;
};

export default memo(forwardRef(TimeInput));