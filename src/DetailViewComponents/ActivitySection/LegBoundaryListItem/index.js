import React, { memo } from 'react';
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';

import { ReactComponent as PlaceIcon } from '../../../common/images/icons/place.svg';

import DateTime from '../../../DateTime';
import ItemActionButton from '../ItemActionButton';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const LegBoundaryListItem = ({ date, title, onJumpToLocation }) => <li className={`${activitySectionStyles.itemRow} ${styles.itemRow}`}>
  <div className={`${activitySectionStyles.itemIcon} ${styles.itemIcon}`}>
    <StartOutlinedIcon />
  </div>

  <div className={activitySectionStyles.itemDetails}>
    <p className={`${activitySectionStyles.itemTitle} ${styles.itemTitle}`}>{title}</p>

    <DateTime className={activitySectionStyles.itemDate} date={date} showElapsed={false} />
  </div>

  <div className={activitySectionStyles.itemActionButtonContainer}>
    {onJumpToLocation && (
      <ItemActionButton onClick={onJumpToLocation} tooltip="Jump to location">
        <PlaceIcon />
      </ItemActionButton>
    )}
  </div>
  <div className={activitySectionStyles.itemActionButtonContainer} />
</li>;

export default memo(LegBoundaryListItem);
