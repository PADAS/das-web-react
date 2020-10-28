import React, { memo, forwardRef, useMemo, useCallback } from 'react';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import PropTypes from 'prop-types';

import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import LocationJumpButton from '../LocationJumpButton';
import AddReport from '../AddReport';
import TimeAgo from '../TimeAgo';

import { getLeaderForPatrol, displayDurationForPatrol } from '../utils/patrols';

const StartStopButton = (props) => {
  return null;
};

const PatrolCardPopover = (props) => {
  const { patrol, isOpen } = props;

  const leader = useMemo(() => getLeaderForPatrol(patrol), [patrol]);

  const subjectTitleForPatrol = useMemo(() => (leader && leader.name) || '', [leader]);

  const subjectLastPosition = useMemo(() => leader && leader.last_position, [leader]);

  const timeOnPatrol = useMemo(() => displayDurationForPatrol(patrol), [patrol]);

  const subjectTimeAtLastPosition = useMemo(() => new Date((subjectLastPosition
    && subjectLastPosition.properties
    && subjectLastPosition.properties.coordinateProperties
    && subjectLastPosition.properties.coordinateProperties.time)
    || leader.last_position_date)
  , [leader.last_position_date, subjectLastPosition]);

  const subjectLastVoiceCall = useMemo(() =>
    (leader
    && leader.last_position_status
    && leader.last_position_status.last_voice_call_start_at)
    || (subjectLastPosition
  && subjectLastPosition.properties
  && subjectLastPosition.properties.last_voice_call_start_at
    ), 
  [leader, subjectLastPosition]);

  const AddReportPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} /* className={styles.popover} */> {/* eslint-disable-line react/display-name */}
    <Popover.Title>What a fine title</Popover.Title>
    <Popover.Content>
      <h6>
        {subjectTitleForPatrol}
      </h6>
      <span>Patrol #{patrol.serial_number}</span>
      <StartStopButton />

      <hr />
      
      <div>
        <span>Radio activity: {subjectLastVoiceCall}</span> {/* radio activity */}
        {!!subjectTimeAtLastPosition.getTime() && <span>Time at current position: <TimeAgo date={subjectTimeAtLastPosition} /></span>} {/* time at position */}
        <span>Time on patrol: {timeOnPatrol}</span> {/* time on patrol */}
        <span>Distance covered: {/* distance covered */}</span>
      </div>

      <hr />

      <HeatmapToggleButton showLabel={false} heatmapVisible={false} />
      <TrackToggleButton showLabel={false} trackVisible={false} trackPinned={false} />
      <LocationJumpButton showLabel={false} bypassLocationValidation={true}
        /* className={styles.patrolButton} onClick={onPatrolJumpClick} */ />

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
  const OverlayThing = <Overlay show={isOpen} /* container={containerRef.current} target={targetRef.current} */>
    <AddReportPopover />
  </Overlay>;

  return <OverlayThing />; 
};

export default memo(PatrolCardPopover);

PatrolCardPopover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};