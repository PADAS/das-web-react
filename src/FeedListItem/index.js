import React, { memo, useMemo } from 'react';

import { adjustColorLightnessByPercentage } from '../utils/colors';

import * as styles from './styles.module.scss';

const FeedListItem = (props) => {
  const { IconComponent = null, TitleComponent, DateComponent = null, ControlsComponent = null, themeColor = 'gray', themeBgColor = null, className = '', ...rest } = props;

  const iconSectionColor = themeColor;
  const bodyBackgroundColor = useMemo(() => themeBgColor || adjustColorLightnessByPercentage(themeColor, 200), [themeBgColor, themeColor]);

  return <li
    className={`${styles.listItem} ${className}`}
    style={{ backgroundColor: bodyBackgroundColor }}
    {...rest}
    >
    {IconComponent && <div
      role='img'
      className={styles.iconContainer}
      style={{ backgroundColor: iconSectionColor }}
    >
      {IconComponent}
    </div>}
    <div className={styles.titleContainer} data-testid='feed-list-item-title-container'>
      {TitleComponent}
    </div>
    {DateComponent && <div className={styles.dateContainer} data-testid='feed-list-item-date-container'>
      {DateComponent}
    </div>}
    {ControlsComponent && <div className={styles.controlsContainer} data-testid='feed-list-item-controls-container'>
      {ControlsComponent}
    </div>}
  </li>;
};

export default memo(FeedListItem);
