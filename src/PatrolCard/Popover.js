import React, { memo, forwardRef, useMemo, useCallback, useEffect } from 'react';
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

import { getLeaderForPatrol, displayDurationForPatrol, displayTitleForPatrol, distanceCoveredForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { fetchTracksIfNecessary } from '../utils/tracks';

import styles from './styles.module.scss';

const StartStopButton = (props) => {
  return null;
};

const PatrolCardPopover = (props) => {
  const { container, isOpen, patrol, target } = props;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);

  const subjectTitleForPatrol = useMemo(() => (leader && leader.name) || '', [leader]);

  const displayTitle = useMemo(() => { 
    return subjectTitleForPatrol || displayTitleForPatrol(patrol);
  }, [patrol, subjectTitleForPatrol]);

  const subjectLastPosition = useMemo(() => leader && leader.last_position, [leader]);

  const timeOnPatrol = useMemo(() => displayDurationForPatrol(patrol), [patrol]);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

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

  useEffect(() => {
    if (leader && leader.id) {
      fetchTracksIfNecessary([leader.id]);
    }
  }, [leader]);

  const PatrolDetailsPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} placement='bottom' /* className={styles.popover} */> {/* eslint-disable-line react/display-name */}
    <Popover.Content>
      {patrolIconId && <DasIcon type='events' iconId={patrolIconId} />}
      <h5>
        {displayTitle}
      </h5>
      <span className={styles.serial}>Patrol #{patrol.serial_number}</span>
      <StartStopButton />

      <div className={styles.details}>
        {!!subjectLastVoiceCall.getTime() && <span>Radio activity: <TimeAgo date={subjectLastVoiceCall} /></span>} {/* radio activity */}
        {!!subjectTimeAtLastPosition.getTime() && <span>Time at current position: <TimeAgo date={subjectTimeAtLastPosition} showSuffix={false} /></span>} {/* time at position */}
        <span>Time on patrol: {timeOnPatrol}</span> {/* time on patrol */}
        <span>Distance covered: <PatrolDistanceCovered patrol={patrol} />{/* distance covered */}</span>
      </div>

      <div className={styles.controls}>
        <HeatmapToggleButton showLabel={false} heatmapVisible={false} />
        <TrackToggleButton showLabel={false} trackVisible={false} trackPinned={false} />
        <LocationJumpButton showLabel={false} bypassLocationValidation={true}
          /* className={styles.patrolButton} onClick={onPatrolJumpClick} */ />
      </div>

      {/*  <AddReport showLabel={false} reportData={{
        location: {
          latitude: location.lat,
          longitude: location.lng,
        }
      }} onSaveSuccess={onComplete} onSaveError={onComplete} /> */}

      {/* buttons and stuff */}
    </Popover.Content>
  </Popover>
  );

  return <Overlay show={isOpen} target={target.current} container={container.current} rootClose>
    <PatrolDetailsPopover className={styles.popover} />
  </Overlay>; 
};

export default memo(PatrolCardPopover);

PatrolCardPopover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};