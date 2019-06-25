import React, { memo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import styles from './styles.module.scss';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import HeatmapStyleControls from '../HeatmapStyleControls';

import InfoIcon from '../common/images/icons/information.svg';

const HeatmapLegend = memo(function HeatmapLegend({ tracks, onClose, onTrackRemoveButtonClick }) {
  const subjectCount = tracks.length;
  const totalTrackCount = tracks.reduce((accumulator, track) => accumulator + track.features[0].geometry.coordinates.length, 0);
  let displayTitle, iconSrc;

  if (subjectCount === 1) {
    const { title, image } = tracks[0].features[0].properties;
    displayTitle = `${title}: Tracks`;
    iconSrc = image;
  } else {
    displayTitle = `Tracks for ${tracks.length} subjects`;
  }


  return (
    <div className={styles.legend}>
      <button className={styles.close} onClick={onClose}>close</button>
      <h6>
        {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
        {displayTitle}
        {subjectCount > 1 && (
          <OverlayTrigger trigger="click" rootClose placement="right" overlay={
            <Popover className={styles.popover} id="track-details">
              <ul>
                {tracks.map(({ features }) => {
                  const [feature] = features;
                  const { properties: { title, image, id } } = feature;
                  const onRemoveTrackClick = () => onTrackRemoveButtonClick(id);

                  return <li key={id}>
                    <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
                    <div>
                      <span>{title}</span>
                      <small>{feature.geometry.coordinates.length} points</small>
                    </div>
                    <Button variant="secondary" onClick={onRemoveTrackClick}>remove</Button>
                  </li>;
                })}
              </ul>
            </Popover>
          }>
            <button type="button">
              <img className={styles.infoIcon} src={InfoIcon} alt='Info icon' />
            </button>
          </OverlayTrigger>
        )}
      </h6>
      <div className={styles.gradient}></div>
      <span>{totalTrackCount} total points</span>
      <OverlayTrigger trigger="click" rootClose placement='auto' overlay={
        <Popover className={styles.controlPopover}>
          <HeatmapStyleControls showCancel={false} />
        </Popover>
      }>
        <button type="button" className={styles.gearButton}></button>
      </OverlayTrigger>
    </div>
  );
}, (prev, current) => {
  return isEqual(prev.tracks, current.tracks);
});

HeatmapLegend.propTypes = {
  tracks: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onTrackRemoveButtonClick: PropTypes.func.isRequired,
};

export default HeatmapLegend;