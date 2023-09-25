import React, { forwardRef, memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { adjustColorLightnessByPercentage } from '../utils/colors';

import styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
const FeedListItem = forwardRef((props, ref) => {
  const { IconComponent = null, TitleComponent, DateComponent = null, ControlsComponent = null, themeColor = 'gray', themeBgColor = null, className = '', ...rest } = props;

  const iconSectionColor = themeColor;
  const bodyBackgroundColor = useMemo(() => themeBgColor || adjustColorLightnessByPercentage(themeColor, 200), [themeBgColor, themeColor]);

  return <li
      className={`${styles.listItem} ${className}`}
      style={{ backgroundColor: bodyBackgroundColor }}
      {...rest}
      ref={ref}
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
});

export default memo(FeedListItem);

FeedListItem.propTypes = {
  className: PropTypes.string,
  themeColor: PropTypes.string.isRequired,
  themeBgColor: PropTypes.string,
  IconComponent: PropTypes.element,
  TitleComponent: PropTypes.element.isRequired,
  DateComponent: PropTypes.element,
  ControlsComponent: PropTypes.element,
};