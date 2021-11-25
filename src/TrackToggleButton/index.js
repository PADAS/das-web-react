import React, { memo } from 'react';
import PropTypes from 'prop-types';
import LoadingOverlay from '../LoadingOverlay';
import styles from './styles.module.scss';

const TrackToggleButton = (props) => {
  const { className: externalClassName, disabled, trackVisible, trackPinned, onClick, showLabel, loading, ...rest } = props;
  const className = trackPinned ? 'pinned' : trackVisible ? 'visible' : '';
  const hoverText = className ? (className === 'pinned' ? 'Tracks pinned' : 'Tracks visible') : 'Tracks hidden';


  return <div className={`${styles.container}${showLabel ? ` ${styles.hasLabel}` : ''}`}>
    {loading && <LoadingOverlay className={styles.loadingOverlay} />}
    <button disabled={disabled} title={hoverText} type="button" className={`${styles.button} ${styles[className]} ${externalClassName || ''}`} onClick={onClick} {...rest}></button>
    {showLabel && <span>{hoverText}</span>}
  </div>;
};

export default memo(TrackToggleButton);

TrackToggleButton.defaultProps = {
  onClick() {
    console.log('track button click');
  },
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