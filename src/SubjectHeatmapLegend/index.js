import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { trimmedHeatmapTrackData } from '../selectors/tracks';
import { updateHeatmapSubjects } from '../ducks/map-ui';

import HeatmapLegend from '../HeatmapLegend';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const TitleElement = memo((props) => { // eslint-disable-line
  const { displayTitle, iconSrc, subjectCount, trackData, onRemoveTrackClick } = props;

  const { t } = useTranslation('map-legends');

  const convertTrackToSubjectDetailListItem = ({ track }) => {
    const { properties: { title, image, id }, geometry } = track.features[0];
    const pointCount = geometry ? geometry.coordinates.length : 0;

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>{t('pointCount', { count: pointCount })}</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemoveTrackClick}>{t('remove')}</Button>
    </li>;
  };
  return <h6>
    {displayTitle}
    {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
    {subjectCount > 1 && <OverlayTrigger
      onExited={() => mapInteractionTracker.track('Close Heatmap Legend Subject List')}
      onEntered={() => mapInteractionTracker.track('Show Heatmap Legend Subject List')} trigger="click" rootClose placement="right" overlay={
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
  </h6>;
});

const SubjectHeatmapLegend = ({ trackData, trackLength: { length: track_days }, onClose, heatmapSubjectIDs, updateHeatmapSubjects }) => {
  const { t } = useTranslation('map-legends');

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

  const onRemoveTrackClick = ({ target: { value: id } }) => {
    mapInteractionTracker.track('Remove Subject Tracks Via Heatmap Legend Popover');
    updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));
  };

  return <HeatmapLegend
    title={<TitleElement displayTitle={displayTitle} iconSrc={iconSrc} subjectCount={subjectCount} trackData={trackData} onRemoveTrackClick={onRemoveTrackClick} />}
    pointCount={trackPointCount}
    dayCount={track_days}
    onClose={onClose} />;
};

const mapStateToProps = (state) => ({
  trackData: trimmedHeatmapTrackData(state),
  trackLength: state.view.trackLength,
  heatmapSubjectIDs: state.view.heatmapSubjectIDs,
});

export default connect(mapStateToProps, { updateHeatmapSubjects })(memo(SubjectHeatmapLegend));

/* HEATMAP
  
title
point count
onClose

*/


SubjectHeatmapLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
};