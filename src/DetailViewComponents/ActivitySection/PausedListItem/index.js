import React, { memo } from 'react';

import { ReactComponent as PauseIcon } from '../../../common/images/icons/pause.svg';

import DateTime from '../../../DateTime';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const PausedListItem = ({ date, durationLabel }) => <li className={`${activitySectionStyles.itemRow} ${styles.itemRow}`}>
  <div className={`${activitySectionStyles.itemIcon} ${styles.itemIcon}`}>
    <PauseIcon />
  </div>

  <div className={activitySectionStyles.itemDetails}>
    <p className={`${activitySectionStyles.itemTitle} ${styles.itemTitle}`}>
      Patrol Paused {durationLabel ? `for ${durationLabel}` : ''}
    </p>

    <DateTime className={activitySectionStyles.itemDate} date={date} showElapsed={false} />
  </div>

  <div className={activitySectionStyles.itemActionButtonContainer} />
  <div className={activitySectionStyles.itemActionButtonContainer} />
</li>;

export default memo(PausedListItem);
