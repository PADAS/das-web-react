import React, { memo, useCallback, useState } from 'react';
import DefaultDateTimePicker from 'react-datetime-picker';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const DateTimePicker = (props) => {
  const [temporaryCalendarProps, setTemporaryCalendarProps] = useState({});

  const handleEscapePress = useCallback((event) => {
    const { key } = event;
    if (key === 'Escape' 
    && temporaryCalendarProps.isCalendarOpen) {
      event.preventDefault();
      event.stopPropagation();
      setTemporaryCalendarProps({});
    }
  }, [temporaryCalendarProps]);

  const onKeyDown = useCallback((event) => {
    handleEscapePress(event);
    props.onKeyDown && props.onKeyDown(event);
  }, [handleEscapePress, props]);

  const handleCalendarOpen = useCallback(() => {
    setTemporaryCalendarProps({
      isCalendarOpen: props.isCalendarOpen || true,
    });
  }, [props]);



  return <DefaultDateTimePicker onKeyDown={onKeyDown} onCalendarOpen={handleCalendarOpen} {...DATEPICKER_DEFAULT_CONFIG} {...props} {...temporaryCalendarProps} />;
};

export default memo(DateTimePicker);