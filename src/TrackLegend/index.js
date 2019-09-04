import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import MapLegend from '../MapLegend';
import TrackLengthControls from '../TrackLengthControls';
import InfoIcon from '../common/images/icons/information.svg';

import { updateTrackState } from '../ducks/map-ui';

import { trimmedVisibleTrackFeatureCollection, trimmedVisibleTrackPointFeatureCollection } from '../selectors';

import styles from './styles.module.scss';

const TrackLegend = (props) => {
  const { tracks, tracksAsPoints, onClose, subjectTrackState, updateTrackState, onTrackLengthChange } = props;

  const subjectCount = tracks.features.length;
  const trackPointCount = tracksAsPoints.features.length;
  let displayTitle, iconSrc;

  const onRemoveTrackClick = ({ target: { value: id } }) =>
    updateTrackState({
      pinned: subjectTrackState.pinned.filter(item => item !== id),
      visible: subjectTrackState.visible.filter(item => item !== id),
    });

  const convertTrackToSubjectDetailListItem = (track) => {
    const { properties: { title, image, id } } = track;

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>{track.geometry.coordinates.length} points</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemoveTrackClick}>remove</Button>
    </li>;
  };

  if (subjectCount === 1) {
    const { title, image } = tracks.features[0].properties;
    displayTitle = `Tracks: ${title}`;
    iconSrc = image;
  } else {
    displayTitle = `Tracks: ${subjectCount} subjects`;
  }

  const titleElement = <h6>
    {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
    {displayTitle}
  </h6>;

  const triggerSibling = () => subjectCount > 1 && <OverlayTrigger trigger="click" rootClose placement="right" overlay={
    <Popover className={styles.popover} id="track-details">
      <ul>
        {tracks.features.map(convertTrackToSubjectDetailListItem)}
      </ul>
    </Popover>
  }>
    <button type="button">
      <img className={styles.infoIcon} src={InfoIcon} alt='Info icon' / >
    </button>
  </OverlayTrigger>;

  return subjectCount && <MapLegend
    titleElement={titleElement}
    onClose={onClose}
    triggerSibling={triggerSibling}
    settingsComponent={<TrackLengthControls onTrackLengthChange={onTrackLengthChange} />} 
  >
    <div className={styles.gradient}></div>
    <span>{trackPointCount} total points</span>
  </MapLegend>;
};

const mapStatetoProps = (state) => ({
  tracks: trimmedVisibleTrackFeatureCollection(state),
  tracksAsPoints: trimmedVisibleTrackPointFeatureCollection(state),
  subjectTrackState: state.view.subjectTrackState,
});

export default connect(mapStatetoProps, { updateTrackState })(memo(TrackLegend));