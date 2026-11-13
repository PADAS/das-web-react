import { memo, useCallback, useMemo, useRef } from 'react';

import { adjustColorLightnessByPercentage } from '../utils/colors';

import * as styles from './styles.module.scss';

const FeedListItem = ({
  className = '',
  Component = 'li',
  ControlsComponent = null,
  DateComponent = null,
  IconComponent = null,
  onClick,
  themeBgColor = null,
  themeColor = 'gray',
  TitleComponent,
  ...otherProps
}) => {
  const controlsRef = useRef(null);

  const bodyBackgroundColor = useMemo(
    () => themeBgColor || adjustColorLightnessByPercentage(themeColor, 200),
    [themeBgColor, themeColor]
  );

  // Clicking one of the controls shouldn't open the patrol.
  const onClickItem = useCallback((event) => {
    if (!controlsRef.current?.contains(event.target)) {
      onClick?.(event);
    }
  }, [onClick]);

  return <Component
    className={`${styles.listItem} ${className}`}
    onClick={onClick && onClickItem}
    style={{ backgroundColor: bodyBackgroundColor }}
    {...otherProps}
  >
    {IconComponent && <div className={styles.iconContainer} role="img" style={{ backgroundColor: themeColor }}>
      {IconComponent}
    </div>}

    <div className={styles.titleContainer} data-testid="feed-list-item-title-container">
      {TitleComponent}
    </div>

    {DateComponent && <div className={styles.dateContainer} data-testid="feed-list-item-date-container">
      {DateComponent}
    </div>}

    {ControlsComponent && <div
      className={styles.controlsContainer}
      data-testid="feed-list-item-controls-container"
      ref={controlsRef}
    >
      {ControlsComponent}
    </div>}
  </Component>;
};

export default memo(FeedListItem);
