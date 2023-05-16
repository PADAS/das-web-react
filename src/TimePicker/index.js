import React, { memo, useCallback, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import OptionsPopover from './OptionsPopover';

import styles from './styles.module.scss';

const TimePicker = ({
  className,
  maxTime,
  minTime,
  minutesInterval,
  onChange,
  onKeyDown,
  showDurationFromMinTime,
  value,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [writtenValue, setWrittenValue] = useState(null);

  const isTimeBelowMax = useCallback((time) => !maxTime || maxTime >= time, [maxTime]);

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
      overlay={<OptionsPopover
        isTimeBelowMax={isTimeBelowMax}
        showDurationFromMinTime={showDurationFromMinTime}
        minTime={minTime}
        onChange={onChange}
        value={value}
        minutesInterval={minutesInterval}
      />}
      placement="bottom-start"
      trigger="focus"
    >
      <input
        className={styles.timeInput}
        data-testid="time-input"
        min={minTime || '00:00'}
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
  minTime: '',
  minutesInterval: 30,
  onKeyDown: null,
  showDurationFromMinTime: false,
  value: '',
};

TimePicker.propTypes = {
  className: PropTypes.string,
  maxTime: PropTypes.string,
  minTime: PropTypes.string,
  minutesInterval: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  showDurationFromMinTime: PropTypes.bool,
  value: PropTypes.string,
};

export default memo(TimePicker);
