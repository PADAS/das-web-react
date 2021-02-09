import React, { useCallback, Fragment, memo, forwardRef, useMemo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';

import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import DasIcon from '../DasIcon';
import TimeAgo from '../TimeAgo';

import { withMap } from '../EarthRangerMap';

import { trackEvent } from '../utils/analytics';

import PatrolStartStopButton from './StartStopButton';

import { canStartPatrol, canEndPatrol, displayTitleForPatrol, getBoundsForPatrol, iconTypeForPatrol, patrolStateAllowsTrackDisplay } from '../utils/patrols';
import { fitMapBoundsForAnalyzer } from '../utils/analyzers';
import { togglePatrolTrackState, updatePatrolTrackState } from '../ducks/patrols';
import { updateTrackState, toggleTrackState } from '../ducks/map-ui';

import { PATROL_CARD_STATES } from '../constants';

import styles from './styles.module.scss';

const PatrolCardPopover = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { container, isOpen, map, onPatrolChange, patrolData, patrolState, patrolTrackState, subjectTrackState,
    target, updatePatrolTrackState, updateTrackState, toggleTrackState, togglePatrolTrackState, dispatch:_dispatch, ...rest } = props;

  const { leader, patrol, trackData } = patrolData;

  const leaderLastPositionCoordinates = useMemo(() => !!leader && leader.last_position && leader.last_position.geometry && leader.last_position.geometry.coordinates, [leader]);

  const canStart = useMemo(() => canStartPatrol(patrol), [patrol]);
  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

  const displayTitle = useMemo(() => displayTitleForPatrol(patrol, leader), [leader, patrol]);

  const subjectLastPosition = useMemo(() => leader && leader.last_position, [leader]);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const isActivePatrol = useMemo(() => patrolState === PATROL_CARD_STATES.ACTIVE, [patrolState]);

  const isScheduledPatrol = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.READY_TO_START 
    || patrolState === PATROL_CARD_STATES.SCHEDULED
    || patrolState === PATROL_CARD_STATES.START_OVERDUE;
  }, [patrolState]);

  const subjectTimeAtLastPosition = useMemo(() => new Date((subjectLastPosition
    && subjectLastPosition.properties
    && subjectLastPosition.properties.coordinateProperties
    && subjectLastPosition.properties.coordinateProperties.time)
    || (leader && leader.last_position_date))
  , [leader, subjectLastPosition]);

  const subjectLastVoiceCall = useMemo(() => new Date(
    (leader
    && leader.last_position_status
    && leader.last_position_status.last_voice_call_start_at)
    || (subjectLastPosition
  && subjectLastPosition.properties
  && subjectLastPosition.properties.last_voice_call_start_at
    )
  ), 
  [leader, subjectLastPosition]);

  const hasDetails = !!subjectLastVoiceCall.getTime() || !!subjectTimeAtLastPosition.getTime();

  const canShowTrack = useMemo(() => patrolStateAllowsTrackDisplay(patrol) && !!trackData, [patrol, trackData]);

  const onOverlayOpen = useCallback(() => {

    trackEvent('Patrol Card', 'Open patrol card popover');

    const patrolTrackHidden = !uniq([...patrolTrackState.visible, ...patrolTrackState.pinned]).includes(patrol.id);
    const leaderTrackHidden = !leader || !uniq([...subjectTrackState.visible, ...subjectTrackState.pinned]).includes(leader.id);
      
    if (canShowTrack) {
      if (patrolTrackHidden) {
        togglePatrolTrackState(patrol.id);
      }
      
      if (leaderTrackHidden && !!leader) {
        toggleTrackState(leader.id);
      }
    }

  }, [canShowTrack, leader, patrol, patrolTrackState.pinned, patrolTrackState.visible, subjectTrackState.pinned, subjectTrackState.visible, togglePatrolTrackState, toggleTrackState]);

  const onOverlayClose = useCallback(() => {
    const patrolTrackVisible = patrolTrackState.visible.includes(patrol.id);

    if (patrolTrackVisible) {
      updatePatrolTrackState({
        ...patrolTrackState,
        visible: patrolTrackState.visible.filter(id => id !== patrol.id),
      });
    }
  }, [patrol.id, patrolTrackState, updatePatrolTrackState]);

  const patrolBounds = useMemo(() => getBoundsForPatrol(patrolData), [patrolData]);

  const onLocationClick = useCallback(() => {
    trackEvent('Patrol Card', 'Click "jump to location" from patrol card popover');
    
    fitMapBoundsForAnalyzer(map, patrolBounds);
  }, [map, patrolBounds]);

  const canShowControls = useMemo(() =>
    !isScheduledPatrol &&
    (canShowTrack || !!patrolBounds)
  , [canShowTrack, isScheduledPatrol, patrolBounds]);

  return <Overlay show={isOpen} target={target.current} placement='auto' flip='true' container={container.current} onEntered={onOverlayOpen} onExited={onOverlayClose} rootClose>
    <Popover {...rest} placement='left' className={styles.popover}> {/* eslint-disable-line react/display-name */}
      <Popover.Content  ref={ref}>
        {patrolIconId && <DasIcon type='events' iconId={patrolIconId} />}
        <h5>
          {displayTitle}
        </h5>
        <span className={styles.serial}>Patrol #{patrol.serial_number}</span>
        {(canStart || canEnd) && <PatrolStartStopButton patrol={patrol} onPatrolChange={onPatrolChange} />}

        {isActivePatrol && <Fragment>
          {!!hasDetails && <div className={styles.details}>
            {!!subjectLastVoiceCall.getTime() && <span>Mic activity: <TimeAgo date={subjectLastVoiceCall} /></span>} {/* radio activity */}
            {!!subjectTimeAtLastPosition.getTime() && <span>Time since last movement (est.): <TimeAgo date={subjectTimeAtLastPosition} showSuffix={false} /></span>} {/* time at position */}
          </div>}
  
        </Fragment>
        }

        {canShowControls && <div className={styles.controls}>
          {!!canShowTrack && !!leader && <PatrolAwareTrackToggleButton patrolData={patrolData} showLabel={false} />}
          {!!patrolBounds && <LocationJumpButton onClick={onLocationClick} bypassLocationValidation={true} coordinates={leaderLastPositionCoordinates} map={map} />}
        </div>}

      </Popover.Content>
    </Popover>
  </Overlay>; 
});

const mapStateToProps = ({ view: { patrolTrackState, subjectTrackState } }) => ({ patrolTrackState, subjectTrackState });


export default connect(mapStateToProps, { togglePatrolTrackState, updatePatrolTrackState, updateTrackState, toggleTrackState }, null, {
  forwardRef: true,
})(memo(withMap(PatrolCardPopover)));

PatrolCardPopover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};