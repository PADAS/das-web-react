import React, { useCallback, Fragment, memo, forwardRef, useMemo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';

import HeatmapToggleButton from '../HeatmapToggleButton';
import PatrolAwareTrackToggleButton from '../TrackToggleButton/PatrolAwareTrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import DasIcon from '../DasIcon';
import AddReport from '../AddReport';
import TimeAgo from '../TimeAgo';

import { withMap } from '../EarthRangerMap';

import PatrolStartStopButton from './StartStopButton';

import { canStartPatrol, canEndPatrol,calcPatrolCardState, getLeaderForPatrol, displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { togglePatrolTrackState, updatePatrolTrackState } from '../ducks/patrols';
import { updateTrackState, toggleTrackState } from '../ducks/map-ui';

import { PATROL_CARD_STATES } from '../constants';

import styles from './styles.module.scss';

const PatrolCardPopover = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { container, isOpen, map, onHide, onPatrolChange, patrol, patrolTrackState, subjectTrackState, target, updatePatrolTrackState, updateTrackState, toggleTrackState, togglePatrolTrackState, dispatch:_dispatch, ...rest } = props;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);

  const leaderLastPositionCoordinates = useMemo(() => !!leader && leader.last_position && leader.last_position.geometry && leader.last_position.geometry.coordinates, [leader]);

  const canStart = useMemo(() => canStartPatrol(patrol), [patrol]);
  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

  const displayTitle = useMemo(() => displayTitleForPatrol(patrol), [patrol]);

  const subjectLastPosition = useMemo(() => leader && leader.last_position, [leader]);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const patrolState = useMemo(() => calcPatrolCardState(patrol), [patrol]);

  const isScheduledPatrol = useMemo(() => {
    return patrolState === PATROL_CARD_STATES.READY_TO_START 
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

  const onOverlayOpen = useCallback(() => {
    if (!leader) return;

    const patrolTrackHidden = !uniq([...patrolTrackState.visible, ...patrolTrackState.pinned]).includes(patrol.id);
    const leaderTrackHidden = !uniq([...subjectTrackState.visible, ...subjectTrackState.pinned]).includes(leader.id);
      
    if (patrolTrackHidden) {
      togglePatrolTrackState(patrol.id);
    }
      
    if (leaderTrackHidden) {
      toggleTrackState(leader.id);
    }

  }, [leader, patrol.id, patrolTrackState.pinned, patrolTrackState.visible, subjectTrackState.pinned, subjectTrackState.visible, togglePatrolTrackState, toggleTrackState]);


  const onOverlayClose = useCallback(() => {
    if (!leader) return;

    onHide();

    const patrolTrackIsPinned = patrolTrackState.pinned.includes(patrol.id);
    const subjectTrackIsPinned = subjectTrackState.pinned.includes(leader.id);
    
    if (patrolTrackIsPinned && subjectTrackIsPinned) return;

    if (!patrolTrackIsPinned) {
      updatePatrolTrackState({
        ...patrolTrackState,
        visible: patrolTrackState.visible.filter(id => id !== patrol.id),
      });
    }

    if (!subjectTrackIsPinned) {
      updateTrackState({
        ...subjectTrackState,
        visible: subjectTrackState.visible.filter(id => id !== leader.id),
      });
    }

  }, [leader, patrol.id, patrolTrackState, subjectTrackState, updatePatrolTrackState, updateTrackState]);

  return <Overlay show={isOpen} target={target.current} placement='auto' flip='true' container={container.current} onEntered={onOverlayOpen} onHide={onOverlayClose} rootClose>
    <Popover {...rest} placement='left' className={styles.popover}> {/* eslint-disable-line react/display-name */}
      <Popover.Content ref={ref}>
        {patrolIconId && <DasIcon type='events' iconId={patrolIconId} />}
        <h5>
          {displayTitle}
        </h5>
        <span className={styles.serial}>Patrol #{patrol.serial_number}</span>
        {(canStart || canEnd) && <PatrolStartStopButton patrol={patrol} onPatrolChange={onPatrolChange} />}

        {!isScheduledPatrol && <Fragment>
          <div className={styles.details}>
            {!!subjectLastVoiceCall.getTime() && <span>Mic activity: <TimeAgo date={subjectLastVoiceCall} /></span>} {/* radio activity */}
            {!!subjectTimeAtLastPosition.getTime() && <span>Time since last movement (est.): <TimeAgo date={subjectTimeAtLastPosition} showSuffix={false} /></span>} {/* time at position */}
          </div>
  
          <div className={styles.controls}>
            <HeatmapToggleButton disabled={!leader} showLabel={false} heatmapVisible={false} />
            <PatrolAwareTrackToggleButton patrol={patrol} showLabel={false} />
            <LocationJumpButton disabled={!leader} bypassLocationValidation={true} coordinates={leaderLastPositionCoordinates} map={map} />
          </div>
          <AddReport className={styles.addButton} showLabel={false} /* onSaveSuccess={onComplete} onSaveError={onComplete} */ />
        </Fragment>
        }

        {/* buttons and stuff */}
      </Popover.Content>
    </Popover>
  </Overlay>; 
});

const mapStateToProps = ({ view: { patrolTrackState, subjectTrackState } }) => ({ patrolTrackState, subjectTrackState });


export default connect(mapStateToProps, { /* addHeatmapSubjects, removeHeatmapSubjects, */ togglePatrolTrackState, updatePatrolTrackState, updateTrackState, toggleTrackState }, null, {
  forwardRef: true,
})(withMap(memo(PatrolCardPopover)));

PatrolCardPopover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};