import React from 'react';

import { format, generateCurrentTimeZoneTitle, STANDARD_DATE_FORMAT } from '../utils/datetime';

import TimeAgo from '../TimeAgo';

import * as styles from './styles.module.scss';

const DateTime = ({ className = '', date, showElapsed = true, suffix, ...otherProps }) => {
  if (!date) {
    return null;
  }

  const dateText = format(new Date(date), STANDARD_DATE_FORMAT);
  const timeZoneTitle = generateCurrentTimeZoneTitle();

  return <div className={`${styles.dateTime} ${className}`} data-testid="date-time" {...otherProps}>
    <time
      aria-label={`${dateText}, ${timeZoneTitle}`}
      className={styles.date}
      dateTime={new Date(date).toISOString()}
      title={timeZoneTitle}
    >
      {dateText}
    </time>

    {showElapsed && <TimeAgo className={styles.timeAgo} date={date} suffix={suffix} />}
  </div>;
};

export default DateTime;
