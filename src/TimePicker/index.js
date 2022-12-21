import React, { memo, useMemo, useState } from 'react';
import addMinutes from 'date-fns/add_minutes';
import differenceInMilliseconds from 'date-fns/difference_in_milliseconds';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { getHoursAndMinutesString, durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const timeConfig = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT;
timeConfig.units = ['h', 'm'];
const getHumanizedTimeDuration =  durationHumanizer(timeConfig);

const TimePicker = ({
  minutesInterval,
  onChange,
  optionsToDisplay,
  showDurationFromStartTime,
  startTime,
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const TimeOptionsPopover = useMemo(() => {
    const initialTimeParts = (startTime || value).split(':');
    const initialTimeDate = new Date();
    initialTimeDate.setHours(initialTimeParts[0], initialTimeParts[1], '00');

    const options = [];
    let accumulatedMinutes = minutesInterval;

    while (options.length < optionsToDisplay) {
      const dateWithAccumulation = addMinutes(initialTimeDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);

      options.push({
        value: timeValue,
        duration: showDurationFromStartTime
          ? ` (${getHumanizedTimeDuration(differenceInMilliseconds(dateWithAccumulation, initialTimeDate))})`
          : null,
      });

      accumulatedMinutes += minutesInterval;
    }

    return <Popover className={styles.popoverOptions}>
      <ul>
        {options.map((option) => <li key={option.value} onClick={() => onChange(option.value)}>
          <span>{option.value}</span>
          {option.duration && <span>{option.duration}</span>}
        </li>)}
      </ul>
    </Popover>;
  }, [minutesInterval, onChange, optionsToDisplay, showDurationFromStartTime, startTime, value]);

  return <div className={styles.inputWrapper}>
    <ClockIcon/>

    <OverlayTrigger
      placement="bottom"
      trigger="focus"
      onToggle={setIsOpen}
      overlay={TimeOptionsPopover}
    >
      <input
        className={styles.timeInput}
        data-testid="time-input"
        min={startTime || '00:00'}
        onChange={(e) => onChange(e.target.value)}
        type="time"
        value={value}
      />
    </OverlayTrigger>

    <div className={`${styles.triangle} ${isOpen ? styles.open : ''}`} data-testid="time-input-triangle-arrow" />
  </div>;
};

TimePicker.defaultProps = {
  minutesInterval: 30,
  optionsToDisplay: 5,
  showDurationFromStartTime: false,
  startTime: '',
};

TimePicker.propTypes = {
  minutesInterval: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  optionsToDisplay: PropTypes.number,
  showDurationFromStartTime: PropTypes.bool,
  startTime: PropTypes.string,
  value: PropTypes.string.isRequired,
};

export default memo(TimePicker);
