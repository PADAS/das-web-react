import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import setSeconds from 'date-fns/set_seconds';
import isFuture from 'date-fns/is_future';

import DateTimePickerPopover from '../DateTimePickerPopover';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import styles from './styles.module.scss';

const PatrolDateInput = (props) => {
  const { autoCheckLabel = 'Automatic', calcSubmitButtonTitle, children,
    isAuto = true, title, value, onChange, className, ...rest } = props;

  const [stateTime, setStateTime] = useState(value);
  const [autoChecked, setAutoChecked] = useState(isAuto);
  const [tempPopoverProps, setTempPopoverProps] = useState({});

  const onHide = useCallback(() => {
    setStateTime(value);
  }, [value]);

  const commitTimeChange = useCallback(() => {
    onChange(stateTime, autoChecked);

    setTempPopoverProps({ popoverOpen: false });
    setTimeout(() => setTempPopoverProps({}), 1000);
  }, [autoChecked, onChange, stateTime]);

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

  const canShowAutoCheck = useMemo(() =>
    Math.abs(differenceInMinutes(new Date(stateTime), new Date())) > 1
    && isFuture(new Date(stateTime)
    ), [stateTime]);

  useEffect(() => {
    setStateTime(value);
  }, [value]);

  return <div>
    <DateTimePickerPopover
      {...DATEPICKER_DEFAULT_CONFIG}
      value={stateTime} 
      className={timeClassName} 
      {...tempPopoverProps} 
      onHide={onHide} 
      onEnter={commitTimeChange}
      onChange={onTimeChange}
      {...rest}
    >  
      <div className={styles.dateTimePickerChildren}>
        <Button disabled={!timeBeingEdited} variant='primary' type='button' onClick={commitTimeChange}>
          {buttonTitle}
        </Button>
        {canShowAutoCheck && <label htmlFor='autoStart'>
          <input checked={autoChecked} onChange={() => setAutoChecked(!autoChecked)} disabled={!timeBeingEdited} type='checkbox' id='autoStart' /> {autoCheckLabel}
        </label>}
      </div>
    </DateTimePickerPopover>
  </div>;
};

export default memo(PatrolDateInput);