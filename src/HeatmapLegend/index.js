import React, { memo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import styles from './styles.module.scss';

const HeatmapLegend = memo(function HeatmapLegend({ tracks, onClose, onTrackRemoveButtonClick }) {
  const subjectCount = tracks.length;
  const totalTrackCount = tracks.reduce((accumulator, track) => accumulator + track.features[0].geometry.coordinates.length, 0);
  let displayTitle, iconSrc;

  if (subjectCount === 1) {
    const { title, image } = tracks[0].features[0].properties;
    displayTitle = `${title}: Tracks`;
    iconSrc = image;
  } else {
    displayTitle = `Tracks for ${tracks.length} subjects`
  }


  return (
    <div className={styles.legend}>
      <button className={styles.close} onClick={onClose}>close</button>
      <h6>
        {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
        {displayTitle}
      </h6>
      <div className={styles.gradient}></div>
      <span>{totalTrackCount} total points</span>
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