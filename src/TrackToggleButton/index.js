import React, { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import SubjectControlButton from '../SubjectControls/button';

import styles from './styles.module.scss';

const TrackToggleButton = ({ className, trackVisible, trackPinned, showTransparentIcon, ...restProps }, ref) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'trackToggleButton' });

  let containerClasses = styles.container;
  if (trackPinned) {
    containerClasses += ' pinned';
  } else if (trackVisible) {
    containerClasses += ' visible';
  }

  let buttonClasses = `${styles.button} ${showTransparentIcon ? styles.defaultTransparent : styles.default} ${className}`;
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
    {...restProps}
  />;
};

const TrackToggleButtonForwardRef = forwardRef(TrackToggleButton);

TrackToggleButtonForwardRef.defaultProps = {
  className: '',
  showTransparentIcon: false,
};

TrackToggleButtonForwardRef.propTypes = {
  className: PropTypes.string,
  showTransparentIcon: PropTypes.bool,
  trackPinned: PropTypes.bool.isRequired,
  trackVisible: PropTypes.bool.isRequired,
};

export default memo(TrackToggleButtonForwardRef);
