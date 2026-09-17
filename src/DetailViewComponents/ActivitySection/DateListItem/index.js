import React, { memo } from 'react';

import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ClockIcon } from '../../../common/images/icons/clock-icon.svg';

import { dateIsValid, format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';

import Link from '../../../Link';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const DateListItem = ({ date, icon: Icon = ClockIcon, link = null, title, variant = null }) => {
  const parsedDate = date ? new Date(date) : null;

  return <li className={`${activitySectionStyles.listItem} ${activitySectionStyles.itemRow} ${variant ? styles[variant] : ''}`}>
    <div className={activitySectionStyles.itemIcon}>
      <Icon aria-hidden="true" data-testid="dateListItem-icon" />
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

    <div className={activitySectionStyles.itemActionButtonContainer}>
      {!!link && <Link
        aria-label={link.label}
        className={`${activitySectionStyles.actionButton} ${styles.linkIcon}`}
        title={link.label}
        to={link.to}
      >
        <ArrowIntoIcon aria-hidden="true" />
      </Link>}
    </div>

    <div className={activitySectionStyles.itemActionButtonContainer} />
  </li>;
};

export default memo(DateListItem);
