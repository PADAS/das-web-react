import React, { useCallback, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import { fitMapBoundsForAnalyzer } from '../utils/analyzers';
import { MapContext } from '../App';
import usePatrol from '../hooks/usePatrol';

import LocationJumpButton from '../LocationJumpButton';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';

import styles from './styles.module.scss';

const PatrolTrackControls = ({ className, onLocationClick, patrol }) => {
  const {
    patrolData,
    patrolTrackState,
    trackState,

    canShowTrack,
    patrolBounds,
  } = usePatrol(patrol);

  const map = useContext(MapContext);

  const trackToggleButtonRef = useRef(null);

  const { leader } = patrolData;

  const handleLocationClick = useCallback((event) => {
    const patrolTrackIsVisible = [...patrolTrackState.pinned, ...patrolTrackState.visible].includes(patrol.id);
    const leaderTrackIsVisible = !!leader && [...trackState.pinned, ...trackState.visible].includes(leader.id);

    if (!patrolTrackIsVisible || (!!leader && !leaderTrackIsVisible)) {
      trackToggleButtonRef?.current?.click();
    }

    fitMapBoundsForAnalyzer(map, patrolBounds);
    onLocationClick(event);
  }, [leader, map, onLocationClick, patrol.id, patrolBounds, patrolTrackState, trackState]);

  return <div className={`${styles.patrolTrackControls} ${className}`}>
    {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton
      buttonRef={trackToggleButtonRef}
      data-testid={`patrol-list-item-track-btn-${patrol.id}`}
      patrolData={patrolData}
      showLabel={false}
    />}

    {!!patrolBounds && <LocationJumpButton
      bypassLocationValidation
      data-testid={`patrol-list-item-jump-btn-${patrol.id}`}
      onClick={handleLocationClick}
    />}
  </div>;
};

PatrolTrackControls.defaultProps = {
  className: '',
};

PatrolTrackControls.propTypes = {
  className: PropTypes.string,
  onLocationClick: PropTypes.func.isRequired,
  patrol: PropTypes.object.isRequired,
};

export default PatrolTrackControls;
