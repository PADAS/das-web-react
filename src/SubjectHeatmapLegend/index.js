import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

import { getHeatmapTrackPoints, getArrayOfVisibleHeatmapTracks } from '../selectors';
import { updateHeatmapSubjects } from '../ducks/map-ui';

import HeatmapLegend from '../HeatmapLegend';

import InfoIcon from '../common/images/icons/information.svg';

import styles from './styles.module.scss';

const SubjectHeatmapLegend = ({ tracks, tracksAsPoints, onClose, heatmapSubjectIDs, updateHeatmapSubjects }) => {
  const subjectCount = tracks.length;
  const trackPointCount = tracksAsPoints.features.length;
  let displayTitle, iconSrc;

  const onRemoveTrackClick = ({ target: { value: id } }) =>
    updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));

  const convertTrackToSubjectDetailListItem = ({ features }) => {
    const [feature] = features;
    const { properties: { title, image, id } } = feature;

    return <li key={id}>
      <img className={styles.icon} src={image} alt={`Icon for ${title}`} />
      <div>
        <span>{title}</span>
        <small>{feature.geometry.coordinates.length} points</small>
      </div>
      <Button variant="secondary" value={id} onClick={onRemoveTrackClick}>remove</Button>
    </li>;
  };

  if (subjectCount === 1) {
    const { title, image } = tracks[0].features[0].properties;
    displayTitle = `${title}: Tracks`;
    iconSrc = image;
  } else {
    displayTitle = `Tracks for ${tracks.length} subjects`;
  }

  const titleElement = <h5>
    {iconSrc && <img className={styles.icon} src={iconSrc} alt={`Icon for ${displayTitle}`} />}
    {displayTitle}
    {subjectCount > 1 && (
      <OverlayTrigger trigger="click" rootClose placement="right" overlay={
        <Popover className={styles.popover} id="track-details">
          <ul>
            {tracks.map(convertTrackToSubjectDetailListItem)}
          </ul>
        </Popover>
      }>
        <button type="button">
          <img className={styles.infoIcon} src={InfoIcon} alt='Info icon' />
        </button>
      </OverlayTrigger>
    )}
  </h5>;


  return <HeatmapLegend
    title={titleElement}
    pointCount={trackPointCount}
    onClose={onClose} />;
};

const mapStateToProps = (state) => ({
  tracks: getArrayOfVisibleHeatmapTracks(state),
  tracksAsPoints: getHeatmapTrackPoints(state),
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