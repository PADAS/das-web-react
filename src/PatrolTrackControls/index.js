import React, { useCallback, useContext, useRef } from 'react';

import { PREVIEW_FEATURES } from '../constants';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';
import { MapContext } from '../MapContext';
import { usePreviewFeature } from '../hooks';
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

    canShowTrack,
    patrolBounds,
  } = usePatrol(patrol);

  const map = useContext(MapContext);

  const trackToggleButtonRef = useRef(null);

  const { leader } = patrolTrackData;

  const handleLocationClick = useCallback((event) => {
    const patrolTrackIsVisible = [...patrolTrackState.pinned, ...patrolTrackState.visible].includes(patrol.id);
    const leaderTrackIsVisible = patrolSchemasEnabled
      || (!!leader && [...trackState.pinned, ...trackState.visible].includes(leader.id));

    if (!patrolTrackIsVisible || (!!leader && !leaderTrackIsVisible)) {
      trackToggleButtonRef?.current?.click();
    }

    fitMapBoundsForAnalyzer(map, patrolBounds);
    onLocationClick(event);
  }, [leader, map, onLocationClick, patrol.id, patrolBounds, patrolSchemasEnabled, patrolTrackState, trackState]);

  return <div className={`${styles.patrolTrackControls} ${className}`}>
    {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton
      buttonRef={trackToggleButtonRef}
      data-testid={`patrol-list-item-track-btn-${patrol.id}`}
      patrol={patrol}
      patrolData={patrolTrackData}
      showLabel={false}
    />}

    {!!patrolBounds && <LocationJumpButton
      bypassLocationValidation
      data-testid={`patrol-list-item-jump-btn-${patrol.id}`}
      onClick={handleLocationClick}
    />}
  </div>;
};

export default PatrolTrackControls;
