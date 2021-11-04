import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { adjustColorLightnessByPercentage } from '../utils/colors';

import styles from './styles.module.scss';

const FeedListItem = (props) => {
  const { IconComponent, TitleComponent, DateComponent, ControlsComponent, themeColor, className, key, ...rest } = props;

  const iconSectionColor = themeColor;
  const bodyBackgroundColor = adjustColorLightnessByPercentage(themeColor, 200);


  return <li className={`${styles.listItem} ${className}`} key={key} style={{ backgroundColor: bodyBackgroundColor }} {...rest}>
    {IconComponent && <div role='img' className={styles.iconContainer} style={{ backgroundColor: iconSectionColor }}>
      {IconComponent}
    </div>}
    {TitleComponent && <div className={styles.titleContainer}>
      {TitleComponent}
    </div>}
    {DateComponent && <div className={styles.dateContainer}>
      {DateComponent}
    </div>}
    {ControlsComponent && <div className={styles.controlsContainer}>
      {ControlsComponent}
    </div>}
  </li>;
};

export default memo(FeedListItem);

FeedListItem.defaultProps = {
  showJumpButton: true,
  showDate: true,
};

FeedListItem.propTypes = {
  className: PropTypes.string,
  key: PropTypes.string,
  themeColor: PropTypes.string.isRequired,
  IconComponent: PropTypes.element.isRequired,
  TitleComponent: PropTypes.element.isRequired,
  DateComponent: PropTypes.element.isRequired,
  ControlsComponent: PropTypes.element.isRequired,
};