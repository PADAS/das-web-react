import React from 'react';

import TimeAgo from '../TimeAgo';
import { STANDARD_DATE_FORMAT, generateCurrentTimeZoneTitle, format } from '../utils/datetime';

import * as styles from './styles.module.scss';

const DateTime = ({ date, showElapsed = true, className = '', ...rest }) => {

  if (!date){
    return null;
  }

  return <div className={`${styles.container} ${className}`} data-testid="date-time" title={generateCurrentTimeZoneTitle()} {...rest}>
    <span className={styles.date}>
      {
        format(new Date(date), STANDARD_DATE_FORMAT)
      }
    </span>
    {showElapsed && <TimeAgo className={styles.elapsed} date={date} {...rest} />}
  </div>;
};

export default DateTime;
