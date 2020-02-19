import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import { trackEvent } from '../utils/analytics';
import { trimmedVisibleHeatmapTrackFeatureCollection, trimmedHeatmapPointFeatureCollection } from '../selectors/tracks';
import { updateHeatmapSubjects } from '../ducks/map-ui';

import HeatmapLegend from '../HeatmapLegend';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import styles from './styles.module.scss';

const SubjectHeatmapLegend = ({ tracks, tracksAsPoints, onClose, heatmapSubjectIDs, updateHeatmapSubjects }) => {
  const subjectCount = tracks.features.length;
  const trackPointCount = tracksAsPoints.features.length;
  let displayTitle, iconSrc;

  const onRemoveTrackClick = ({ target: { value: id } }) => {
    trackEvent('Map Interaction', 'Remove Subject Tracks Via Heatmap Legend Popover');
    updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));
  };

  const convertTrackToSubjectDetailListItem = (feature) => {
    const { properties: { title, image, id } } = feature;

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>{feature.geometry ? feature.geometry.coordinates.length : 0} points</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemoveTrackClick}>remove</Button>
    </li>;
  };

  if (subjectCount === 1) {
    const { title, image } = tracks.features[0].properties;
    displayTitle = `${title}`;
    iconSrc = image;
  } else {
    displayTitle = `${tracks.features.length} subjects`;
  }

  const titleElement = <h6>
    {displayTitle}
    {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
    {subjectCount > 1 && <OverlayTrigger
      onExited={() => trackEvent('Map Interaction', 'Close Heatmap Legend Subject List')}
      onEntered={() => trackEvent('Map Interaction', 'Show Heatmap Legend Subject List')} trigger="click" rootClose placement="right" overlay={
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
  </h6>;

  return <HeatmapLegend
    title={titleElement}
    pointCount={trackPointCount}
    onClose={onClose} />;
};

const mapStateToProps = (state) => ({
  tracks: trimmedVisibleHeatmapTrackFeatureCollection(state),
  tracksAsPoints: trimmedHeatmapPointFeatureCollection(state),
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