import React, { memo } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const TrackToggleButton = memo(function TrackToggleButton(props) {
  const { trackVisible, trackPinned, trackId, onButtonClick } = props;
  const className = trackPinned ? 'pinned' : trackVisible ? 'visible' : '';
  const hoverText = className ? (className === 'pinned' ? 'Tracks pinned' : 'Tracks visible') : 'Tracks hidden';


return <div className={styles.container}>
    <button title={hoverText} type="button" className={`${styles.button} ${styles[className]}`} onClick={() => onButtonClick(trackId)}></button>
    {hoverText}
  </div>
});

export default TrackToggleButton;

TrackToggleButton.defaultProps = {
  onButtonClick() {
    console.log('track button click');
  },
};

TrackToggleButton.propTypes = {
  trackVisible: PropTypes.bool.isRequired,
  trackPinned: PropTypes.bool.isRequired,
  onButtonClick: PropTypes.func,
  trackId: PropTypes.string.isRequired,
};