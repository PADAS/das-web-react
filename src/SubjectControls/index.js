import React, { lazy, memo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addHeatmapSubjects, removeHeatmapSubjects, toggleTrackState } from '../ducks/map-ui';
import { addModal } from '../ducks/modals';
import { canShowTrackForSubject, getSubjectLastPositionCoordinates } from '../utils/subjects';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../utils/analytics';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { subjectIsStatic } from '../utils/subjects';
import { usePermissions } from '../hooks';

// HeatmapToggleButton needs to be imported after TrackToggleButton to work properly (seems like some side effect)
import TrackToggleButton from '../TrackToggleButton';
import HeatmapToggleButton from '../HeatmapToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import SubjectHistoryButton from '../SubjectHistoryButton';
import SubjectMessagesPopover from '../SubjectMessagesPopover';

import styles from './styles.module.scss';

const SubjectHistoricalDataModal = lazy(() => import('../SubjectHistoricalDataModal'));

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const SubjectControls = ({
  children,
  className,
  showHeatmapButton,
  showHistoryButton,
  showJumpButton,
  showLabels,
  showMessageButton,
  showTitles,
  showTrackButton,
  subject,
  ...restProps
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectControls' });

  const subjectIsInHeatmap = useSelector((state) => state.view.heatmapSubjectIDs.includes(subject.id));
  const tracksLoaded = useSelector((state) => !!state.data.tracks[subject.id]);
  const tracksPinned = useSelector((state) => state.view.subjectTrackState.pinned.includes(subject.id));
  const tracksVisible = useSelector((state) => state.view.subjectTrackState.visible.includes(subject.id));

  const canViewMessages = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.READ);

  const [loadingHeatmap, setHeatmapLoadingState] = useState(false);
  const [loadingTracks, setTrackLoadingState] = useState(false);

  const canShowTrack = canShowTrackForSubject(subject);
  const coordinates = getSubjectLastPositionCoordinates(subject);
  const hasAdditionalDeviceProps = !!subject?.device_status_properties?.length;
  const canShowHistoryButton = showHistoryButton && (subjectIsStatic(subject) ? !!hasAdditionalDeviceProps : true);
  const isMessageable = !!canViewMessages && !!showMessageButton && !!subject?.messaging?.length;

  const onTrackButtonClick = async () => {
    setTrackLoadingState(true);

    if (!tracksLoaded) {
      await fetchTracksIfNecessary([subject.id]);
    }

    setTrackLoadingState(false);
    dispatch(toggleTrackState(subject.id));

    if (tracksPinned) {
      mapLayerTracker.track('Uncheck Subject Show Tracks button', `Subject:${subject.subject_type}`);
    } else if (tracksVisible) {
      mapLayerTracker.track('Pin Subject Show Tracks button', `Subject:${subject.subject_type}`);
    } else {
      mapLayerTracker.track('Check Subject Show Tracks button', `Subject:${subject.subject_type}`);
    }
  };

  const toggleHeatmapState = async () => {
    setHeatmapLoadingState(true);

    await fetchTracksIfNecessary([subject.id]);

    setHeatmapLoadingState(false);

    if (subjectIsInHeatmap) {
      mapLayerTracker.track('Uncheck Subject Heatmap button', `Subject Type:${subject.subject_type}`);

      return dispatch(removeHeatmapSubjects(subject.id));
    } else {
      mapLayerTracker.track('Check Subject Heatmap button', `Subject Type:${subject.subject_type}`);

      return dispatch(addHeatmapSubjects(subject.id));
    }
  };

  return (showHeatmapButton || showTrackButton || showJumpButton) ? <div
      className={`${styles.controls} ${className || ''} ${showTitles ? '' : styles.noTitles}`}
      {...restProps}
    >
    {showTrackButton && canShowTrack && <TrackToggleButton
      loading={loadingTracks}
      onClick={onTrackButtonClick}
      showLabel={showLabels}
      trackPinned={tracksPinned}
      trackVisible={tracksVisible}
    />}

    {showHeatmapButton && canShowTrack && <HeatmapToggleButton
      heatmapVisible={subjectIsInHeatmap}
      loading={loadingHeatmap}
      onButtonClick={toggleHeatmapState}
      showLabel={showLabels}
    />}

    {isMessageable && <SubjectMessagesPopover
      className={styles.messagingButton}
      showLabel={showLabels}
      subject={subject}
    />}

    {canShowHistoryButton && <SubjectHistoryButton
      data-testid={`history-button-${subject.id}`}
      onClick={() => dispatch(addModal({
        content: SubjectHistoricalDataModal,
        subjectId: subject.id,
        subjectIsStatic: subjectIsStatic(subject),
        title: t('historicalDataModalTitle', { subjectName: subject.name }),
      }))}
      showLabel={showLabels}
    />}

    {showJumpButton && coordinates && <LocationJumpButton
      clickAnalytics={[
        MAP_LAYERS_CATEGORY,
        'Click Jump To Subject Location button',
        `Subject Type:${subject.subject_type}`
      ]}
      coordinates={coordinates}
    />}

    {children}
  </div> : null;
};

SubjectControls.defaultProps = {
  children: null,
  className: '',
  showHeatmapButton: true,
  showHistoryButton: false,
  showJumpButton: true,
  showLabels: true,
  showMessageButton: true,
  showTitles: true,
  showTrackButton: true,
};

SubjectControls.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  showHeatmapButton: PropTypes.bool,
  showHistoryButton: PropTypes.bool,
  showJumpButton: PropTypes.bool,
  showLabels: PropTypes.bool,
  showMessageButton: PropTypes.bool,
  showTitles: PropTypes.bool,
  showTrackButton: PropTypes.bool,
  subject: PropTypes.shape({
    device_status_properties: PropTypes.array,
    id: PropTypes.string,
    messaging: PropTypes.array,
    name: PropTypes.string,
    subject_type: PropTypes.string,
  }).isRequired,
};

export default memo(SubjectControls);
