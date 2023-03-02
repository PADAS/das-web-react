import React, { memo, useCallback, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { default as BootstrapPopover } from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';
import TimeOptionsPopover from './TimeOptionsPopover';

const TimePicker = ({
  className,
  maxTime,
  minutesInterval,
  onChange,
  onKeyDown,
  showDurationFromStartTime,
  startTime,
  value,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [writtenValue, setWrittenValue] = useState(null);
  const isTimeBelowMax = useCallback((time) => !maxTime || maxTime >= time, [maxTime]);

  const Popover = useCallback((props) => {
    return <BootstrapPopover className={styles.popoverOptions} {...props} >
      <TimeOptionsPopover
          isTimeBelowMax={isTimeBelowMax}
          showDurationFromStartTime={showDurationFromStartTime}
          onChange={onChange}
          value={value}
          minutesInterval={minutesInterval}
      />
    </BootstrapPopover>;
  }, [isTimeBelowMax, showDurationFromStartTime, onChange, value, minutesInterval]);

  const handleChange = useCallback((event) => setWrittenValue(event.target.value), [setWrittenValue]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.target.blur();
    }

    onKeyDown?.(event);
  }, [onKeyDown]);

  const onToggle = useCallback((show) => {
    setIsOpen(show);
    if (!show && writtenValue) {
      if (isTimeBelowMax(writtenValue)) {
        onChange(writtenValue);
      }

      setWrittenValue(null);
    }
  }, [isTimeBelowMax, onChange, writtenValue]);

  return <div className={`${styles.inputWrapper} ${className}`}>
    <ClockIcon/>

    <OverlayTrigger
      onToggle={onToggle}
      overlay={Popover}
      placement="bottom-start"
      trigger="focus"
    >
      <input
        className={styles.timeInput}
        data-testid="time-input"
        min={startTime || '00:00'}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        type="time"
        value={writtenValue || value}
        {...rest}
      />
    </OverlayTrigger>

    <div className={`${styles.triangle} ${isOpen ? styles.open : ''}`} data-testid="time-input-triangle-arrow" />
  </div>;
};

TimePicker.defaultProps = {
  className: '',
  maxTime: '',
  minutesInterval: 30,
  optionsToDisplay: 5,
  showDurationFromStartTime: false,
  startTime: '',
  value: '',
};

TimePicker.propTypes = {
  className: PropTypes.string,
  maxTime: PropTypes.string,
  minutesInterval: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  optionsToDisplay: PropTypes.number,
  showDurationFromStartTime: PropTypes.bool,
  startTime: PropTypes.string,
  value: PropTypes.string,
};

export default memo(TimePicker);
