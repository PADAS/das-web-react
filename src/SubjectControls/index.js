import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { canShowTrackForSubject, getSubjectLastPositionCoordinates } from '../utils/subjects';
import { addHeatmapSubjects, removeHeatmapSubjects, toggleTrackState } from '../ducks/map-ui';
import { fetchTracks } from '../ducks/tracks';
import TrackToggleButton from '../TrackToggleButton';
import HeatmapToggleButton from '../HeatmapToggleButton';
import { getSubjectControlState } from './selectors';

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
    fetchTracks,
    map,
    ...rest } = props;

  const { id } = subject;

  const fetchTracksIfNecessary = () => {
    if (tracksLoaded) return new Promise(resolve => resolve());
    return fetchTracks(id);
  };

  const onTrackButtonClick = async (id) => {
    await fetchTracksIfNecessary(id);

    toggleTrackState(id);
  };

  const jumpToSubject = subject =>  map.jumpTo({
    center: getSubjectLastPositionCoordinates(subject),
    // zoom: 19,
  });

  const toggleHeatmapState = async (id) => {
    await fetchTracksIfNecessary(id);

    if (subjectIsInHeatmap) return removeHeatmapSubjects(id);
    return addHeatmapSubjects(id);
  };

  if (!canShowTrackForSubject(subject)) return null;
  if (!showHeatmapButton && !showTrackButton && !showJumpButton) return null;


  return <div className={`${styles.controls} ${className || ''} ${showTitles ? '' : styles.noTitles}`} {...rest}>
    {showTrackButton && <TrackToggleButton onButtonClick={onTrackButtonClick} trackId={id} trackVisible={tracksVisible} trackPinned={tracksPinned} />}
    {showHeatmapButton && <HeatmapToggleButton onButtonClick={toggleHeatmapState} subjectId={id} heatmapVisible={subjectIsInHeatmap} />}
    {showJumpButton && <button onClick={() => jumpToSubject(subject)}>Jumpy wumpy</button>}
  </div>
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

export default connect(mapStateToProps, { fetchTracks, toggleTrackState, addHeatmapSubjects, removeHeatmapSubjects })(SubjectControls);
