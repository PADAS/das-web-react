import React, { forwardRef, memo, useMemo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import SubjectControlButton from '../SubjectControls/button';

import styles from './styles.module.scss';

const TrackToggleButton = (props, ref) => {
  const { className = '', trackVisible, trackPinned, showTransparentIcon, ...rest } = props;
  const { t } = useTranslation('patrols', { keyPrefix: 'trackToggleButton' });
  const containerClasses = useMemo(() => {
    let string = styles.container;

    if (trackPinned) string+= ' pinned';
    if (!trackPinned && trackVisible) string+= ' visible';

    return string;
  }, [trackPinned, trackVisible]);

  const buttonClasses = useMemo(() => {
    const buttonClass = styles.button;
    const defaultIcon = showTransparentIcon ? `${buttonClass} ${styles.defaultTransparent}` : `${buttonClass} ${styles.default}`;
    let string = `${defaultIcon} ${className}`;
    if (trackPinned) string+= ` ${styles.pinned}`;
    if (!trackPinned && trackVisible) string+= ` ${styles.visible}`;

    return string;
  }, [className, showTransparentIcon, trackPinned, trackVisible]);

  const labelText = t((trackPinned && 'tracksPinned') || (trackVisible && 'tracksOn') || 'tracksOff');

  return <SubjectControlButton ref={ref} buttonClassName={buttonClasses} containerClassName={containerClasses} labelText={labelText} {...rest} />;
};

export default memo(forwardRef(TrackToggleButton));

TrackToggleButton.defaultProps = {
  onClick: noop,
  showLabel: true,
  loading: false,
  showTransparentIcon: false,
};

TrackToggleButton.propTypes = {
  trackVisible: PropTypes.bool.isRequired,
  trackPinned: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  loading: PropTypes.bool,
  showTransparentIcon: PropTypes.bool,
};