import React, { forwardRef, memo, useMemo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import SubjectControlButton from '../SubjectControls/button';

const TrackToggleButton = (props, ref) => {
  const { className = '', trackVisible, trackPinned, ...rest } = props;
  const containerClasses = useMemo(() => {
    let string = styles.container;

    if (trackPinned) string+= ' pinned';
    if (!trackPinned && trackVisible) string+= ' visible';

    return string;
  }, [trackPinned, trackVisible]);

  const buttonClasses = useMemo(() => {
    let string = `${styles.button} ${className}`;
    if (trackPinned) string+= ` ${styles.pinned}`;
    if (!trackPinned && trackVisible) string+= ` ${styles.visible}`;

    return string;
  }, [className, trackPinned, trackVisible]);

  const labelText = (trackPinned && 'Tracks pinned') || (trackVisible && 'Tracks on') || 'Tracks off';

  return <SubjectControlButton ref={ref} buttonClassName={buttonClasses} containerClassName={containerClasses} labelText={labelText} {...rest} />;
};

export default memo(forwardRef(TrackToggleButton));

TrackToggleButton.defaultProps = {
  onClick: noop,
  showLabel: true,
  loading: false,
};

TrackToggleButton.propTypes = {
  trackVisible: PropTypes.bool.isRequired,
  trackPinned: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  loading: PropTypes.bool,
};