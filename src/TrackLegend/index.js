import React, { memo, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import distanceInWords from 'date-fns/distance_in_words';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { trackTimeEnvelope as trackTimeEnvelopeSelector } from '../selectors/tracks';
import { updateTrackState } from '../ducks/map-ui';

import MapLegend from '../MapLegend';
import TrackLengthControls from '../TrackLengthControls';
import TrackToggleButton from '../TrackToggleButton';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const getIconForTrack = (track, subjectStore) => {
  const { properties: { id, image } } = track.features[0];

  return subjectStore[id]?.last_position?.properties?.image || image;
};

const TitleElement = ({
  displayTitle,
  iconSrc,
  onRemoveTrackClick,
  subjectCount,
  subjectStore,
  trackData,
  trackDuration,
  trackPointCount,
}) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.titleElement' });

  const convertTrackToSubjectDetailListItem = ({ track }) => {
    const { properties: { id, title } } = track.features[0];
    const pointCount = track.features[0].geometry ? track.features[0].geometry.coordinates.length : 0;

    return <li key={id}>
      <img alt={t('icon', { title })} className={styles.icon} src={getIconForTrack(track, subjectStore)} />

      <div>
        <span>{title}</span>

        <small>{t('pointCount', { count: pointCount })}</small>
      </div>

      <Button onClick={onRemoveTrackClick} value={id} variant="secondary">{t('removeButton')}</Button>
    </li>;
  };

  return <div className={styles.titleWrapper}>
    <TrackToggleButton className={styles.trackIcon} showLabel={false} trackPinned={false} trackVisible={false} />

    <div className={styles.innerTitleWrapper}>
      <h6>
        {displayTitle}

        {iconSrc && <img alt={t('icon', { title: displayTitle })} className={styles.icon} src={iconSrc} />}

        {subjectCount > 1 && <OverlayTrigger
          onEntered={() => mapInteractionTracker.track('Show Tracks Legend Subject List')}
          onExited={() => mapInteractionTracker.track('Close Tracks Legend Subject List')}
          overlay={<Popover className={styles.popover} id="track-details">
            <ul>{trackData.map(convertTrackToSubjectDetailListItem)}</ul>
          </Popover>}
          placement="right"
          rootClose
          trigger="click"
        >
          <button className={styles.infoButton} type="button">
            <InfoIcon className={styles.infoIcon} />
          </button>
        </OverlayTrigger>}
      </h6>

      <span>{t('pointsOverTimeSpan', { pointCount: trackPointCount, trackDuration })}</span>
    </div>
  </div>;
};

const TrackLegend = ({ onClose, trackData, trackState }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend' });

  const subjectStore = useSelector((state) => state.data.subjectStore);
  const trackTimeEnvelope = useSelector(trackTimeEnvelopeSelector);

  const hasTrackData = !!trackData.length;
  const subjectCount = uniq([...trackState.visible, ...trackState.pinned]).length;

  const iconSrc = hasTrackData && subjectCount === 1 ? getIconForTrack(trackData[0].track, subjectStore) : null;

  let displayTitle;
  if (!subjectCount || !hasTrackData) {
    displayTitle = null;
  } else if (subjectCount !== 1) {
    displayTitle = t('multipleSubjectsTitle', { count: subjectCount });
  } else {
    displayTitle = trackData[0].track.features[0].properties.title;
  }

  const displayTrackLength = useMemo(
    () => trackTimeEnvelope.until
      ? distanceInWords(new Date(trackTimeEnvelope.from), new Date(trackTimeEnvelope.until))
      : distanceInWordsToNow(new Date(trackTimeEnvelope.from)),
    [trackTimeEnvelope]
  );

  const trackPointCount = useMemo(
    () => trackData.reduce((accumulator, item) => accumulator + item.points.features.length, 0),
    [trackData]
  );

  const onRemoveTrackClick = (event) => {
    mapInteractionTracker.track('Remove Subject Tracks Via Track Legend Popover');

    dispatch(updateTrackState({
      pinned: trackState.pinned.filter((item) => item !== event.target.value),
      visible: trackState.visible.filter((item) => item !== event.target.value),
    }));
  };

  return !!subjectCount && hasTrackData ? <MapLegend
    onClose={onClose}
    settingsComponent={<TrackLengthControls />}
    titleElement={<TitleElement
      displayTitle={displayTitle}
      iconSrc={iconSrc}
      onRemoveTrackClick={onRemoveTrackClick}
      subjectCount={subjectCount}
      subjectStore={subjectStore}
      trackData={trackData}
      trackDuration={displayTrackLength}
      trackPointCount={trackPointCount}
    />}
  /> : null;
};

TrackLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
  trackData: PropTypes.arrayOf(PropTypes.shape({
    points: PropTypes.object,
    track: PropTypes.object,
  })).isRequired,
  trackState: PropTypes.shape({
    pinned: PropTypes.array,
    visible: PropTypes.array,
  }).isRequired,
};

export default memo(TrackLegend);
