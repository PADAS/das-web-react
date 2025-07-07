import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SubjectControlButton from '../SubjectControls/button';

import * as styles from './styles.module.scss';

const TrackToggleButton = ({
  className = '',
  ref,
  showTransparentIcon = false,
  trackPinned,
  trackVisible,
  ...restProps
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'trackToggleButton' });

  let containerClasses = styles.container;
  if (trackPinned) {
    containerClasses += ' pinned';
  } else if (trackVisible) {
    containerClasses += ' visible';
  }

  let buttonClasses = `${styles.button} ${showTransparentIcon ? styles.transparent : styles.normal} ${className}`;
  if (trackPinned) {
    buttonClasses += ` ${styles.pinned}`;
  } else if (trackVisible) {
    buttonClasses += ` ${styles.visible}`;
  }

  return <SubjectControlButton
    buttonClassName={buttonClasses}
    containerClassName={containerClasses}
    labelText={t((trackPinned && 'tracksPinned') || (trackVisible && 'tracksOn') || 'tracksOff')}
    ref={ref}
    data-testid="tracks-toggle-button"
    {...restProps}
  />;
};

export default memo(TrackToggleButton);
