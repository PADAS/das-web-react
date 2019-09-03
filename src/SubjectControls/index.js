import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { canShowTrackForSubject, getSubjectLastPositionCoordinates } from '../utils/subjects';
import { addHeatmapSubjects, removeHeatmapSubjects, toggleTrackState } from '../ducks/map-ui';
import TrackToggleButton from '../TrackToggleButton';
import HeatmapToggleButton from '../HeatmapToggleButton';
import LocationJumpButton from '../LocationJumpButton';

import { getSubjectControlState } from './selectors';

import { fetchTracksIfNecessary } from '../utils/tracks';


import styles from './styles.module.scss';

const SubjectControls = memo((props) => {
  const { subject,
    showHeatmapButton,
    showTrackButton,
    showJumpButton,
    showTitles,
    className,
    toggleTrackState,
    addHeatmapSubjects,
    removeHeatmapSubjects,
    subjectIsInHeatmap,
    tracksLoaded,
    tracksVisible,
    tracksPinned,
    map,
    ...rest } = props;

  const [ loadingHeatmap, setHeatmapLoadingState ] = useState(false);
  const [ loadingTracks, setTrackLoadingState ] = useState(false);

  const { id } = subject;

  const fetchSubjectTracks = () => {
    if (tracksLoaded) return new Promise(resolve => resolve());
    return fetchTracksIfNecessary(id);
  };

  const onTrackButtonClick = async () => {
    setTrackLoadingState(true);
    await fetchSubjectTracks(id);
    setTrackLoadingState(false);

    toggleTrackState(id);
  };

  const coordinates = getSubjectLastPositionCoordinates(subject);

  const toggleHeatmapState = async () => {
    setHeatmapLoadingState(true);
    await fetchTracksIfNecessary(id);
    setHeatmapLoadingState(false);

    if (subjectIsInHeatmap) return removeHeatmapSubjects(id);
    return addHeatmapSubjects(id);
  };

  if (!canShowTrackForSubject(subject)) return null;
  if (!showHeatmapButton && !showTrackButton && !showJumpButton) return null;


  return <div className={`${styles.controls} ${className || ''} ${showTitles ? '' : styles.noTitles}`} {...rest}>
    {showTrackButton && <TrackToggleButton loading={loadingTracks} onButtonClick={onTrackButtonClick} trackVisible={tracksVisible} trackPinned={tracksPinned} />}
    {showHeatmapButton && <HeatmapToggleButton loading={loadingHeatmap} onButtonClick={toggleHeatmapState} heatmapVisible={subjectIsInHeatmap} />}
    {showJumpButton && coordinates && <LocationJumpButton coordinates={coordinates} map={map} />}
  </div>;
});


SubjectControls.defaultProps = {
  showHeatmapButton: true,
  showTrackButton: true,
  showJumpButton: true,
  showTitles: true,
};

SubjectControls.propTypes = {
  subject: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  showHeatmapButton: PropTypes.bool,
  showTrackButton: PropTypes.bool,
  showJumpButton: PropTypes.bool,
  showTitles: PropTypes.bool,
};

const mapStateToProps = (state, props) => getSubjectControlState(state, props);

export default connect(mapStateToProps, { toggleTrackState, addHeatmapSubjects, removeHeatmapSubjects })(SubjectControls);
