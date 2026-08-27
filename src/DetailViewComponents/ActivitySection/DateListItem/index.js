import React, { memo } from 'react';

import { ReactComponent as ClockIcon } from '../../../common/images/icons/clock-icon.svg';

import { dateIsValid, format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';

import * as activitySectionStyles from '../styles.module.scss';

const DateListItem = ({ date, title }) => {
  const parsedDate = date ? new Date(date) : null;

  return <li className={`${activitySectionStyles.listItem} ${activitySectionStyles.itemRow}`}>
    <div className={activitySectionStyles.itemIcon}>
      <ClockIcon aria-hidden="true" data-testid="clock-icon" />
    </div>

    <div className={activitySectionStyles.itemDetails}>
      <p className={activitySectionStyles.itemTitle}>{title}</p>

      {dateIsValid(parsedDate) && <time
        className={activitySectionStyles.itemDate}
        data-testid={`activitySection-dateTime-${parsedDate.getTime()}`}
        dateTime={parsedDate.toISOString()}
      >
        {format(parsedDate, STANDARD_DATE_FORMAT)}
      </time>}
    </div>

    <div className={activitySectionStyles.itemActionButtonContainer} />

    <div className={activitySectionStyles.itemActionButtonContainer} />
  </li>;
};

export default memo(DateListItem);
