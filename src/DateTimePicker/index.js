import React, { memo, useCallback, useState } from 'react';
import DefaultDateTimePicker from 'react-datetime-picker';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const DateTimePicker = (props) => {
  const [temporaryCalendarProps, setTemporaryCalendarProps] = useState({});

  const onKeyDown = (event) => {
    handleEscapePress(event);
    props.onKeyDown && props.onKeyDown(event);
  };

  const handleEscapePress = (event) => {
    const { key } = event;
    if (key === 'Escape' 
    && temporaryCalendarProps.isCalendarOpen) {
      event.preventDefault();
      event.stopPropagation();
      temporaryCalendarProps.onBlur(event);
    }
  };

  const handleCalendarOpen = useCallback(() => {
    setTemporaryCalendarProps({
      isCalendarOpen: props.isCalendarOpen || true,
      onBlur(e) {
        setTemporaryCalendarProps({
        });
        !!props.onBlur && props.onBlur(e);
      },
    });
  }, [props]);



  return <DefaultDateTimePicker onKeyDown={onKeyDown} onCalendarOpen={handleCalendarOpen} {...DATEPICKER_DEFAULT_CONFIG} {...props} {...temporaryCalendarProps} />;
};

export default memo(DateTimePicker);