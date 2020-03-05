import React, { memo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import MapLegend from '../MapLegend';
import TrackLengthControls from '../TrackLengthControls';
import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';
import TrackToggleButton from '../TrackToggleButton';

import { updateTrackState } from '../ducks/map-ui';

import { trimmedVisibleTrackFeatureCollection, trimmedVisibleTrackPointFeatureCollection } from '../selectors/tracks';

import styles from './styles.module.scss';
import { trackEvent } from '../utils/analytics';

const TrackLegend = (props) => {
  const { tracks, tracksAsPoints, trackLength: { length:track_days }, onClose, subjectTrackState, updateTrackState } = props;

  const subjectCount = tracks.features.length;
  const trackPointCount = tracksAsPoints.features.length;
  let displayTitle, iconSrc;

  const onRemoveTrackClick = ({ target: { value: id } }) => {
    trackEvent('Map Interaction', 'Remove Subject Tracks Via Track Legend Popover');
    updateTrackState({
      pinned: subjectTrackState.pinned.filter(item => item !== id),
      visible: subjectTrackState.visible.filter(item => item !== id),
    });
  };

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
    displayTitle = `${title}`;
    iconSrc = image;
  } else {
    displayTitle = `${subjectCount} subjects`;
  }

  const titleElement = <div className={styles.titleWrapper}>
    <TrackToggleButton trackPinned={false} trackVisible={false} className={styles.trackIcon} showLabel={false} />
    <div className={styles.innerTitleWrapper}>
      <h6>
        {displayTitle}
        {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
        {subjectCount > 1 &&
    <OverlayTrigger trigger="click" rootClose
      onExited={() => trackEvent('Map Interaction', 'Close Tracks Legend Subject List')}
      onEntered={() => trackEvent('Map Interaction', 'Show Tracks Legend Subject List')}
      placement="right" overlay={
        <Popover className={styles.popover} id="track-details">
          <ul>
            {tracks.features.map(convertTrackToSubjectDetailListItem)}
          </ul>
        </Popover>
      }>
      <button type="button" className={styles.infoButton}>
        <InfoIcon className={styles.infoIcon} />
      </button>
    </OverlayTrigger>}
      </h6>
      <span>{trackPointCount} points over {track_days} day{track_days > 1 ? 's' :''}</span>
    </div>
  </div>;


  return subjectCount && <MapLegend
    titleElement={titleElement}
    onClose={onClose}
    settingsComponent={<TrackLengthControls />} 
  >
  </MapLegend>;
};

const mapStatetoProps = (state) => ({
  tracks: trimmedVisibleTrackFeatureCollection(state),
  tracksAsPoints: trimmedVisibleTrackPointFeatureCollection(state),
  subjectTrackState: state.view.subjectTrackState,
  trackLength: state.view.trackLength,
});

export default connect(mapStatetoProps, { updateTrackState })(memo(TrackLegend));