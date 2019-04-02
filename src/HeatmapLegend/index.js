import React, { memo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import styles from './styles.module.scss';

const HeatmapLegend = memo(function HeatmapLegend({ tracks, onClose, onTrackRemoveButtonClick }) {
  const subjectCount = tracks.length;
  const totalTrackCount = tracks.reduce((accumulator, track) => accumulator + track.features[0].geometry.coordinates.length, 0)
  return (
    <div className={styles.legend}>
      <p>Showing tracks for {tracks.length} subjects</p>
      <p>For {totalTrackCount} total points</p>
      <button onClick={onClose}>close</button>
    </div>
  );
}, (prev, current) => {
  return isEqual(prev.tracks, current.tracks);
});

HeatmapLegend.propTypes = {
  tracks: PropTypes.array.isRequired,
  onClose: PropTypes.func,
  onTrackRemoveButtonClick: PropTypes.func,
};

export default HeatmapLegend;