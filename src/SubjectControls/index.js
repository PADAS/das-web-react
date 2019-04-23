import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { canShowTrackForSubject, getSubjectLastPositionCoordinates } from '../utils/subjects';
import { updateHeatmapSubjects, updateTrackState } from '../ducks/map-ui';
import { fetchTracks } from '../ducks/tracks';
import TrackToggleButton from '../TrackToggleButton';
import HeatmapToggleButton from '../HeatmapToggleButton';

import styles from './styles.module.scss';

const SubjectControls = memo((props) => {
  const { subject,
    showHeatmapButton,
    showTrackButton,
    showJumpButton,
    heatmapSubjectIDs,
    subjectTrackState,
    showTitles,
    className,
    updateTrackState,
    updateHeatmapSubjects,
    fetchTracks,
    map,
    ...rest } = props;

  const { id } = subject;

  const toggleTrackState = async (id) => {
    await fetchTracks(id);

    const { visible, pinned } = subjectTrackState;

    if (pinned.includes(id)) {
      return updateTrackState({
        pinned: pinned.filter(item => item !== id),
        visible: visible.filter(item => item !== id),
      });
    }
    if (visible.includes(id)) {
      return updateTrackState({
        pinned: [...pinned, id],
        visible: visible.filter(item => item !== id),
      });
    }
    return updateTrackState({
      visible: [...visible, id],
    });
  };

  const jumpToSubject = subject =>  map.jumpTo({
    center: getSubjectLastPositionCoordinates(subject),
    // zoom: 19,
  });

  const toggleHeatmapState = async (id) => {
    await fetchTracks(id);

    const visible = heatmapSubjectIDs.includes(id);

    if (visible) {
      return updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));
    }
    return updateHeatmapSubjects([...heatmapSubjectIDs, id]);
  };

  if (!canShowTrackForSubject(subject)) return null;
  if (!showHeatmapButton && !showTrackButton && !showJumpButton) return null;


  return <div className={`${styles.controls} ${className || ''} ${showTitles ? '' : styles.noTitles}`} {...rest}>
    {showTrackButton && <TrackToggleButton onButtonClick={toggleTrackState} trackId={id} trackVisible={subjectTrackState.visible.includes(id)} trackPinned={subjectTrackState.pinned.includes(id)} />}
    {showHeatmapButton && <HeatmapToggleButton onButtonClick={toggleHeatmapState} subjectId={id} heatmapVisible={heatmapSubjectIDs.includes(id)} />}
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

const mapStateToProps = ({ view: { subjectTrackState, heatmapSubjectIDs } }) => ({ subjectTrackState, heatmapSubjectIDs });

export default connect(mapStateToProps, { fetchTracks, updateTrackState, updateHeatmapSubjects })(SubjectControls);
