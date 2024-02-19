import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { trimmedHeatmapTrackData } from '../selectors/tracks';
import { updateHeatmapSubjects } from '../ducks/map-ui';

import HeatmapLegend from '../HeatmapLegend';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const TitleElement = ({ displayTitle, iconSrc, onRemoveTrackClick, subjectCount, trackData }) => {
  const { t } = useTranslation('heatmap', { keyPrefix: 'subjectHeatmapLegend.titleElement' });

  const convertTrackToSubjectDetailListItem = ({ track }) => {
    const { properties: { title, image, id }, geometry } = track.features[0];
    const pointCount = geometry ? geometry.coordinates.length : 0;

    return <li key={id}>
      <img alt={`Icon for ${title}`} className={styles.icon} src={image} />

      <div>
        <span>{title}</span>

        <small>{t('pointCount', { count: pointCount })}</small>
      </div>

      <Button onClick={onRemoveTrackClick} value={id} variant="secondary">{t('remove')}</Button>
    </li>;
  };

  return <h6>
    {displayTitle}

    {iconSrc && <img alt={`Icon for ${displayTitle}`} className={styles.icon} src={iconSrc} />}

    {subjectCount > 1 && <OverlayTrigger
      onEntered={() => mapInteractionTracker.track('Show Heatmap Legend Subject List')}
      onExited={() => mapInteractionTracker.track('Close Heatmap Legend Subject List')}
      overlay={<Popover className={styles.popover} id="track-details">
        <ul>{trackData.map(convertTrackToSubjectDetailListItem)}</ul>
      </Popover>}
      placement="right"
      rootClose
      trigger="click"
    >
      <button type="button" className={styles.infoButton}>
        <InfoIcon className={styles.infoIcon} />
      </button>
    </OverlayTrigger>}
  </h6>;
};

const SubjectHeatmapLegend = ({ onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('heatmap', { keyPrefix: 'subjectHeatmapLegend' });

  const heatmapSubjectIDs = useSelector((state) => state.view.heatmapSubjectIDs);
  const trackData = useSelector(trimmedHeatmapTrackData);
  const trackLength = useSelector((state) => state.view.trackLength);

  const subjectCount = trackData.length;
  const trackPointCount = trackData.reduce((accumulator, item) => accumulator + item.points.features.length, 0);

  let displayTitle, iconSrc;
  if (subjectCount === 1) {
    const { title, image } = trackData[0].track.features[0].properties;
    displayTitle = `${title}`;
    iconSrc = image;
  } else {
    displayTitle = t('subjectCount', { count: subjectCount });
  }

  const onRemoveTrackClick = (event) => {
    dispatch(updateHeatmapSubjects(heatmapSubjectIDs.filter((item) => item !== event.target.value)));

    mapInteractionTracker.track('Remove Subject Tracks Via Heatmap Legend Popover');
  };

  return <HeatmapLegend
    dayCount={trackLength.length}
    onClose={onClose}
    pointCount={trackPointCount}
    title={<TitleElement
      displayTitle={displayTitle}
      iconSrc={iconSrc}
      onRemoveTrackClick={onRemoveTrackClick}
      subjectCount={subjectCount}
      trackData={trackData}
    />}
  />;
};

SubjectHeatmapLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default memo(SubjectHeatmapLegend);
