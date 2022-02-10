import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { usePermissions } from '../hooks';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';


import { canShowTrackForSubject, getSubjectLastPositionCoordinates } from '../utils/subjects';
import { addHeatmapSubjects, removeHeatmapSubjects, toggleTrackState } from '../ducks/map-ui';
import TrackToggleButton from '../TrackToggleButton';
import HeatmapToggleButton from '../HeatmapToggleButton';
import SubjectMessagesPopover from '../SubjectMessagesPopover';
import LocationJumpButton from '../LocationJumpButton';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import { getSubjectControlState } from './selectors';

import { fetchTracksIfNecessary } from '../utils/tracks';

import styles from './styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const SubjectControls = (props) => {
  const { subject,
    children,
    showHeatmapButton,
    showTrackButton,
    showJumpButton,
    showMessageButton,
    showTitles,
    showLabels,
    className,
    toggleTrackState,
    addHeatmapSubjects,
    removeHeatmapSubjects,
    subjectIsInHeatmap,
    tracksLoaded,
    tracksVisible,
    tracksPinned,
    ...rest } = props;

  const [ loadingHeatmap, setHeatmapLoadingState ] = useState(false);
  const [ loadingTracks, setTrackLoadingState ] = useState(false);
  const canViewMessages = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.READ);

  const { id } = subject;


  const isMessageable = !!canViewMessages && !!showMessageButton && !!subject?.messaging?.length;
  const canShowTrack = canShowTrackForSubject(subject);

  const fetchSubjectTracks = () => {
    if (tracksLoaded) return new Promise(resolve => resolve());
    return fetchTracksIfNecessary([id]);
  };

  const onTrackButtonClick = async () => {
    setTrackLoadingState(true);
    await fetchSubjectTracks(id);
    setTrackLoadingState(false);
    toggleTrackState(id);

    if (tracksPinned) {
      mapLayerTracker.track('Uncheck Subject Show Tracks button', `Subject:${subject.subject_type}`);
    } else if (tracksVisible) {
      mapLayerTracker.track('Pin Subject Show Tracks button', `Subject:${subject.subject_type}`);
    } else {
      mapLayerTracker.track('Check Subject Show Tracks button', `Subject:${subject.subject_type}`);
    }
  };

  const coordinates = getSubjectLastPositionCoordinates(subject);

  const toggleHeatmapState = async () => {
    setHeatmapLoadingState(true);
    await fetchTracksIfNecessary([id]);
    setHeatmapLoadingState(false);

    if (subjectIsInHeatmap) {
      mapLayerTracker.track('Uncheck Subject Heatmap button',
        `Subject Type:${subject.subject_type}`);
      return removeHeatmapSubjects(id);
    } else {
      mapLayerTracker.track('Check Subject Heatmap button',
        `Subject Type:${subject.subject_type}`);
      return addHeatmapSubjects(id);
    }
  };

  if (!showHeatmapButton && !showTrackButton && !showJumpButton) return null;

  return <div className={`${styles.controls} ${className || ''} 
    ${showTitles ? '' : styles.noTitles}`} {...rest}>

    {isMessageable && <SubjectMessagesPopover
      className={styles.messagingButton}
      subject={subject}
    />}

    {showTrackButton && canShowTrack && <TrackToggleButton
      showLabel={showLabels}
      loading={loadingTracks}
      onClick={onTrackButtonClick}
      trackVisible={tracksVisible}
      trackPinned={tracksPinned}
    />}

    {showHeatmapButton && canShowTrack && <HeatmapToggleButton
      showLabel={showLabels}
      loading={loadingHeatmap}
      onButtonClick={toggleHeatmapState}
      heatmapVisible={subjectIsInHeatmap}
    />}

    {showJumpButton && coordinates && <LocationJumpButton
      coordinates={coordinates}
      clickAnalytics={[
        MAP_LAYERS_CATEGORY,
        'Click Jump To Subject Location button',
        `Subject Type:${subject.subject_type}`
      ]}
    />}

    {children}
  </div>;
};


SubjectControls.defaultProps = {
  showHeatmapButton: true,
  showTrackButton: true,
  showJumpButton: true,
  showMessageButton: true,
  showTitles: true,
  showLabels: true,
};

SubjectControls.propTypes = {
  subject: PropTypes.object.isRequired,
  showHeatmapButton: PropTypes.bool,
  showTrackButton: PropTypes.bool,
  showJumpButton: PropTypes.bool,
  showTitles: PropTypes.bool,
  showLabels: PropTypes.bool,
};

const mapStateToProps = (state, props) => getSubjectControlState(state, props);

export default connect(mapStateToProps, { toggleTrackState, addHeatmapSubjects, removeHeatmapSubjects })(memo(SubjectControls));
