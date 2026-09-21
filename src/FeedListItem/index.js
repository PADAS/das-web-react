import React, { memo, useCallback, useMemo, useRef } from 'react';

import { adjustColorLightnessByPercentage } from '../utils/colors';

import * as styles from './styles.module.scss';

const FeedListItem = (props) => {
  const { IconComponent = null, TitleComponent, DateComponent = null, ControlsComponent = null, themeColor = 'gray', themeBgColor = null, className = '', onClick, ...rest } = props;

  const controlsRef = useRef(null);

  const iconSectionColor = themeColor;
  const bodyBackgroundColor = useMemo(() => themeBgColor || adjustColorLightnessByPercentage(themeColor, 200), [themeBgColor, themeColor]);

  // Clicking one of the controls shouldn't open the patrol.
  const onClickItem = useCallback((event) => {
    if (!controlsRef.current?.contains(event.target)) {
      onClick?.(event);
    }
  }, [onClick]);

  return <li
    className={`${styles.listItem} ${className}`}
    onClick={onClick && onClickItem}
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
    {ControlsComponent && <div className={styles.controlsContainer} data-testid='feed-list-item-controls-container' ref={controlsRef}>
      {ControlsComponent}
    </div>}
  </li>;
};

export default memo(FeedListItem);
