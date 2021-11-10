import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import Calendar from 'react-calendar';

import setHours from 'date-fns/set_hours';
import getHours from 'date-fns/get_hours';

import setMinutes from 'date-fns/set_minutes';
import getMinutes from 'date-fns/get_minutes';

import TimeInput from '../../../inputs/TimeInput';

import 'react-calendar/dist/Calendar.css';

const CALENDAR_CONFIG = {
  clearIcon: null,
  calendarIcon: null,
  format: 'yyyy-MM-dd HH:mm',
  minDate: new Date(2011, 1, 1),
};

const preventEventBubbling = (_value, event) => {
  event.preventDefault();
  event.stopPropagation();
};

const BLOCKED_EVENT_HANDLERS = { /* bugfix for odd react-calendar behavior in which clicks bubble up to every subsequent button control. issue to be filed w/react-calendar in github. */
  onClickMonth: preventEventBubbling,
  onClickYear: preventEventBubbling,
  onClickDecade: preventEventBubbling,
};

const DateTimePicker = (props) => {
  const { value, onChange, ...rest } = props;

  const [timeInputValue, setTimeInputValue] = useState('00:00');
  const firstTimeInputRef = useRef(null);

  useEffect(() => {
    if (value) {
      const hours = getHours(value);
      const minutes = getMinutes(value);

      setTimeInputValue(`${hours}:${minutes}`);
    }
  }, [value]);

  const handleCalendarChange = useCallback((value) => {
    const [hours, minutes] = timeInputValue.split(':');
    let newValue = new Date(value.getTime());

    newValue = setHours(newValue, parseFloat(hours));
    newValue = setMinutes(newValue, parseFloat(minutes));

    setTimeout(() => {
      if (firstTimeInputRef.current) {
        firstTimeInputRef.current.focus();
        firstTimeInputRef.current.select();
      }
    }, 100);

    onChange(newValue);
  }, [onChange, timeInputValue]);

  const handleTimeChange = useCallback((inputValue) => {
    const [hours, minutes] = inputValue.split(':');
    let newValue = new Date(value.getTime());

    newValue = setHours(newValue, parseFloat(hours));
    newValue = setMinutes(newValue, parseFloat(minutes));

    onChange(newValue);
  }, [onChange, value]);

  return <div>
    <Calendar {...CALENDAR_CONFIG} {...BLOCKED_EVENT_HANDLERS} onChange={handleCalendarChange} value={value} {...rest} />
    {!!value && <TimeInput ref={firstTimeInputRef} disabled={!value} value={timeInputValue} onChange={handleTimeChange} />}
  </div>;

};

export default memo(DateTimePicker);