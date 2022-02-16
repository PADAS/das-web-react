import React, { forwardRef, memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import LoadingOverlay from '../LoadingOverlay';
import styles from './styles.module.scss';

const TrackToggleButton = (props, ref) => {
  const { className: externalClassName, disabled, trackVisible, trackPinned, onClick, showLabel, loading, ...rest } = props;
  const className = trackPinned ? 'pinned' : trackVisible ? 'visible' : '';
  const labelText = className ? (className === 'pinned' ? 'Tracks pinned' : 'Tracks on') : 'Tracks off';


  return <div className={`${styles.container} ${className} ${showLabel ? ` ${styles.hasLabel}` : ''}`} onClick={showLabel ? onClick : noop}>
    {loading && <LoadingOverlay className={styles.loadingOverlay} />}
    <button ref={ref} disabled={disabled} title={labelText} type="button" className={`${styles.button} ${styles[className]} ${externalClassName || ''}`} onClick={onClick} {...rest}></button>
    {showLabel && <span>{labelText}</span>}
  </div>;
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