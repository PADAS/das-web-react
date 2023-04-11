import React, { memo } from 'react';

import { ReactComponent as ClockIcon } from '../../../common/images/icons/clock-icon.svg';

import DateTime from '../../../DateTime';

import activitySectionStyles from '../styles.module.scss';
import styles from './styles.module.scss';

const DateListItem = ({ date, title }) => <li className={`${activitySectionStyles.itemRow} ${styles.itemRow}`}>
  <div className={`${activitySectionStyles.itemIcon} ${styles.itemIcon}`}>
    <ClockIcon />
  </div>

  <div className={activitySectionStyles.itemDetails}>
    <p className={`${activitySectionStyles.itemTitle} ${styles.itemTitle}`}>{title}</p>

    <DateTime className={activitySectionStyles.itemDate} date={date} showElapsed={false} />
  </div>

  <div className={activitySectionStyles.itemActionButtonContainer} />
  <div className={activitySectionStyles.itemActionButtonContainer} />
</li>;

export default memo(DateListItem);
