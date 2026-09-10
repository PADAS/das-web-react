import React, { useCallback, useContext, useRef } from 'react';

import { PREVIEW_FEATURES } from '../constants';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';
import { MapContext } from '../MapContext';
import { getPatrolLocationCoordinates, patrolHasTrackData } from '../utils/patrols';
import { usePreviewFeature } from '../hooks';
import useJumpToLocation from '../hooks/useJumpToLocation';
import usePatrol from '../hooks/usePatrol';

import LocationJumpButton from '../LocationJumpButton';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';

import * as styles from './styles.module.scss';

const PatrolTrackControls = ({ className = '', onLocationClick, patrol }) => {
  const patrolSchemasEnabled = usePreviewFeature(PREVIEW_FEATURES.PATROL_SCHEMAS);

  const {
    patrolTrackData,
    patrolTrackState,
    trackState,

    canShowTrack: legacyCanShowTrack,
    patrolBounds,
  } = usePatrol(patrol);

  // Patrol's start/stop geometries are not part of the patrol's track.
  const canShowTrack = patrolSchemasEnabled ? patrolHasTrackData(patrolTrackData) : legacyCanShowTrack;

  const patrolLocationCoordinates = getPatrolLocationCoordinates(patrolTrackData);

  const map = useContext(MapContext);
  const jumpToLocation = useJumpToLocation();

  const trackToggleButtonRef = useRef(null);

  const { leader } = patrolTrackData;

  const handleLocationClick = useCallback((event) => {
    if (patrolSchemasEnabled) {
      jumpToLocation(patrolLocationCoordinates);
      onLocationClick(event);
      return;
    }

    const patrolTrackIsVisible = [...patrolTrackState.pinned, ...patrolTrackState.visible].includes(patrol.id);
    const leaderTrackIsVisible = !!leader && [...trackState.pinned, ...trackState.visible].includes(leader.id);

    if (!patrolTrackIsVisible || (!!leader && !leaderTrackIsVisible)) {
      trackToggleButtonRef?.current?.click();
    }

    fitMapBoundsForAnalyzer(map, patrolBounds);
    onLocationClick(event);
  }, [
    jumpToLocation,
    leader,
    map,
    onLocationClick,
    patrol.id,
    patrolBounds,
    patrolLocationCoordinates,
    patrolSchemasEnabled,
    patrolTrackState,
    trackState,
  ]);

  const showJumpToLocationButton = patrolSchemasEnabled ? !!patrolLocationCoordinates : !!patrolBounds;

  return <div className={`${styles.patrolTrackControls} ${className}`}>
    {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton
      buttonRef={trackToggleButtonRef}
      data-testid={`patrol-list-item-track-btn-${patrol.id}`}
      patrol={patrol}
      patrolData={patrolTrackData}
      showLabel={false}
    />}

    {showJumpToLocationButton && <LocationJumpButton
      bypassLocationValidation
      data-testid={`patrol-list-item-jump-btn-${patrol.id}`}
      onClick={handleLocationClick}
    />}
  </div>;
};

export default PatrolTrackControls;
