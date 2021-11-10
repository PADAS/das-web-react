import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';
import distanceInWords from 'date-fns/distance_in_words';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import uniq from 'lodash/uniq';

import { trackEvent } from '../../../utils/analytics';
import { ReactComponent as InfoIcon } from '../../../common/images/icons/information.svg';
import { updateTrackState } from '../../../ducks/map-ui';
import { trackTimeEnvelope } from '../../../selectors/tracks';

import TrackLengthControls from '../../../tracks/TrackLengthControls';
import TrackToggleButton from '../../../tracks/TrackToggleButton';
import MapLegend from '../MapLegend';

import styles from './styles.module.scss';


const getIconForTrack = (track, subjectStore) => {
  const { properties: { id, image } } = track.features[0];
  const storeMatch = subjectStore[id];

  return (
    storeMatch
    && storeMatch.last_position
    && storeMatch.last_position.properties
    && storeMatch.last_position.properties.image
  ) || image;
};

const TitleElement = memo((props) => { // eslint-disable-line
  const { displayTitle, iconSrc, onRemoveTrackClick, subjectCount, subjectStore, trackData, trackPointCount, trackDuration } = props;

  const convertTrackToSubjectDetailListItem = ({ track }) => {
    const { properties: { title, id } } = track.features[0];

    const image = getIconForTrack(track, subjectStore);

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>{track.features[0].geometry ? track.features[0].geometry.coordinates.length : '0'} points</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemoveTrackClick}>remove</Button>
    </li>;
  };

  return <div className={styles.titleWrapper}>
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
            {trackData.map(convertTrackToSubjectDetailListItem)}
          </ul>
        </Popover>
      }>
          <button type="button" className={styles.infoButton}>
            <InfoIcon className={styles.infoIcon} />
          </button>
        </OverlayTrigger>}
      </h6>
      <span>{trackPointCount} points over {trackDuration}</span>
    </div>
  </div>;
});

const TrackLegend = (props) => {
  const { trackData, onClose, trackState, subjectStore, updateTrackState, trackTimeEnvelope } = props;

  const subjectCount = uniq([...trackState.visible, ...trackState.pinned]).length;
  const trackPointCount = useMemo(() => trackData.reduce((accumulator, item) => accumulator + item.points.features.length, 0), [trackData]);
  const hasTrackData = !!trackData.length;

  const displayTitle = useMemo(() => {
    if (!subjectCount || !hasTrackData) {
      return null;
    }
    if (subjectCount !== 1) {
      return `${subjectCount} subjects`;
    }

    return trackData[0].track.features[0].properties.title;
  }, [hasTrackData, subjectCount, trackData]);

  const displayTrackLength = useMemo(() => {
    const { from, until } = trackTimeEnvelope;
    if (!until) return distanceInWordsToNow(new Date(from));
    return distanceInWords(new Date(from), new Date(until));
  }, [trackTimeEnvelope]);

  const iconSrc = useMemo(() => {
    if (!subjectCount || !hasTrackData ||  subjectCount !== 1) return null;
    return getIconForTrack(trackData[0].track, subjectStore);
  }, [hasTrackData, subjectCount, subjectStore, trackData]);

  const onRemoveTrackClick = ({ target: { value: id } }) => {
    trackEvent('Map Interaction', 'Remove Subject Tracks Via Track Legend Popover');
    updateTrackState({
      pinned: trackState.pinned.filter(item => item !== id),
      visible: trackState.visible.filter(item => item !== id),
    });
  };

  return !!subjectCount && hasTrackData && <MapLegend
    titleElement={
      <TitleElement displayTitle={displayTitle} iconSrc={iconSrc} onRemoveTrackClick={onRemoveTrackClick}
        subjectCount={subjectCount} subjectStore={subjectStore} trackData={trackData}
        trackPointCount={trackPointCount} trackDuration={displayTrackLength} />
    }
    onClose={onClose}
    settingsComponent={<TrackLengthControls />}
    >
  </MapLegend>;
};

const mapStatetoProps = (state) => ({
  subjectStore: state.data.subjectStore,
  trackTimeEnvelope: trackTimeEnvelope(state),
  trackLength: state.view.trackLength,
});

export default connect(mapStatetoProps, { updateTrackState })(memo(TrackLegend));

TrackLegend.propTypes = {
  trackData: PropTypes.array.isRequired,
  trackState: PropTypes.object.isRequired,
};