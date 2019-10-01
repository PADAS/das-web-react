import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import { trimmedVisibleHeatmapTrackFeatureCollection, trimmedHeatmapPointFeatureCollection } from '../selectors/tracks';
import { updateHeatmapSubjects } from '../ducks/map-ui';

import HeatmapLegend from '../HeatmapLegend';

import InfoIcon from '../common/images/icons/information.svg';

import styles from './styles.module.scss';

const SubjectHeatmapLegend = ({ tracks, tracksAsPoints, onClose, heatmapSubjectIDs, updateHeatmapSubjects }) => {
  const subjectCount = tracks.features.length;
  const trackPointCount = tracksAsPoints.features.length;
  let displayTitle, iconSrc;

  const onRemoveTrackClick = ({ target: { value: id } }) =>
    updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));

  const convertTrackToSubjectDetailListItem = (feature) => {
    const { properties: { title, image, id } } = feature;

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>{feature.geometry? feature.geometry.coordinates.length : 0} points</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemoveTrackClick}>remove</Button>
    </li>;
  };

  if (subjectCount === 1) {
    const { title, image } = tracks.features[0].properties;
    displayTitle = `Heatmap: ${title}`;
    iconSrc = image;
  } else {
    displayTitle = `Heatmap: ${tracks.features.length} subjects`;
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
      <img className={styles.infoIcon} src={InfoIcon} alt='Info icon' />
    </button>
  </OverlayTrigger>;

  return <HeatmapLegend
    title={titleElement}
    triggerSibling={triggerSibling}
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