import React, { memo } from 'react';

import { format, generateCurrentTimeZoneTitle, STANDARD_DATE_FORMAT } from '../utils/datetime';

import TimeAgo from '../TimeAgo';

import * as styles from './styles.module.scss';

const DateTime = ({ className = '', date, showElapsed = true, suffix, ...otherProps }) => {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);
  const dateText = format(parsedDate, STANDARD_DATE_FORMAT);
  const label = `${dateText}, ${generateCurrentTimeZoneTitle()}`;

  return <div className={`${styles.dateTime} ${className}`} data-testid="date-time" {...otherProps}>
    <time
      aria-label={label}
      className={styles.date}
      dateTime={parsedDate.toISOString()}
      title={label}
    >
      {dateText}
    </time>

    {showElapsed && <TimeAgo className={styles.timeAgo} date={date} suffix={suffix} />}
  </div>;
};

export default memo(DateTime);
