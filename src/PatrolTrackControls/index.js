import React, { useContext, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { MapContext } from '../App';
import { togglePatrolTrackState } from '../ducks/patrols';
import { toggleTrackState } from '../ducks/map-ui';
import usePatrol from '../hooks/usePatrol';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';

import LocationJumpButton from '../LocationJumpButton';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';

import styles from './styles.module.scss';

const PatrolTrackControls = ({ patrol, className, onLocationClick }) => {
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

  const handleLocationClick = useCallback(() => {
    const patrolTrackIsVisible = [...patrolTrackState.pinned, ...patrolTrackState.visible].includes(patrol.id);
    const leaderTrackIsVisible = !!leader && [...trackState.pinned, ...trackState.visible].includes(leader.id);

    if (!patrolTrackIsVisible
    || (!!leader && !leaderTrackIsVisible)) {
      trackToggleButtonRef?.current?.click();
    }

    fitMapBoundsForAnalyzer(map, patrolBounds);
    onLocationClick();
  }, [leader, map, onLocationClick, patrol.id, patrolBounds, patrolTrackState, patrolTrackState, trackState, trackState]);

  return <div className={`${styles.patrolTrackControls} ${className}`}>
    {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton buttonRef={trackToggleButtonRef} patrolData={patrolData} showLabel={false} data-testid={`patrol-list-item-track-btn-${patrol.id}`} />}
    {!!patrolBounds && <LocationJumpButton onClick={handleLocationClick} bypassLocationValidation={true} data-testid={`patrol-list-item-jump-btn-${patrol.id}`} />}
  </div>;
};

PatrolTrackControls.propTypes = {
  patrol: PropTypes.object.isRequired,
  onLocationClick: PropTypes.func,
  className: PropTypes.string,
};

export default connect(null, { togglePatrolTrackState, toggleTrackState })(PatrolTrackControls);
