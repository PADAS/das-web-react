import React, { useCallback, Fragment, memo, forwardRef, useMemo } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import PropTypes from 'prop-types';

import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import DasIcon from '../DasIcon';
import AddReport from '../AddReport';
import TimeAgo from '../TimeAgo';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';

import PatrolStartStopButton from './StartStopButton';

import { fetchTracksIfNecessary } from '../utils/tracks';
import { canStartPatrol, canEndPatrol,calcPatrolCardState, getLeaderForPatrol, displayDurationForPatrol, displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { togglePatrolTrackState } from '../ducks/patrols';
import { /* addHeatmapSubjects, removeHeatmapSubjects, */ toggleTrackState } from '../ducks/map-ui';

import { PATROL_CARD_STATES } from '../constants';

import styles from './styles.module.scss';

const PatrolCardPopover = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { container, isOpen, onPatrolChange, patrol, target, toggleTrackState, togglePatrolTrackState, dispatch:_dispatch, ...rest } = props;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);

  const canStart = useMemo(() => canStartPatrol(patrol), [patrol]);
  const canEnd = useMemo(() => canEndPatrol(patrol), [patrol]);

  const displayTitle = useMemo(() => displayTitleForPatrol(patrol), [patrol]);

  const subjectLastPosition = useMemo(() => leader && leader.last_position, [leader]);

  const timeOnPatrol = useMemo(() => displayDurationForPatrol(patrol), [patrol]);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const patrolState = useMemo(() => calcPatrolCardState(patrol), [patrol]);

  const onTrackButtonClick = useCallback(async () => {
    if (leader && leader.id) {
      await fetchTracksIfNecessary([leader.id]);
      toggleTrackState(leader.id);
      togglePatrolTrackState(leader.id);
    }
  }, [leader, togglePatrolTrackState, toggleTrackState]);

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

  return <Overlay show={isOpen} target={target.current} placement='auto' flip='true' container={container.current} rootClose>
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
            {!!subjectLastVoiceCall.getTime() && <span>Radio activity: <TimeAgo date={subjectLastVoiceCall} /></span>} {/* radio activity */}
            {!!subjectTimeAtLastPosition.getTime() && <span>Time at current position: <TimeAgo date={subjectTimeAtLastPosition} showSuffix={false} /></span>} {/* time at position */}
            <span>Time on patrol: {timeOnPatrol}</span> {/* time on patrol */}
            <span>Distance covered: <PatrolDistanceCovered patrol={patrol} />{/* distance covered */}</span>
          </div>
  
          <div className={styles.controls}>
            <HeatmapToggleButton disabled={!leader} showLabel={false} heatmapVisible={false} />
            <TrackToggleButton disabled={!leader} showLabel={false} trackVisible={false} trackPinned={false} onClick={onTrackButtonClick} />
            <LocationJumpButton bypassLocationValidation={true}
              /* className={styles.patrolButton} onClick={onPatrolJumpClick} */ />
          </div>
          <AddReport className={styles.addButton} showLabel={false} /* onSaveSuccess={onComplete} onSaveError={onComplete} */ />
        </Fragment>
        }

        {/* buttons and stuff */}
      </Popover.Content>
    </Popover>
  </Overlay>; 
});



export default connect(null, { /* addHeatmapSubjects, removeHeatmapSubjects, */ togglePatrolTrackState, toggleTrackState }, null, {
  forwardRef: true,
})(memo(PatrolCardPopover));

PatrolCardPopover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};