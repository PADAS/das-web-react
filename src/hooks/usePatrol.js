import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  calcColorThemeForPatrolState,
  calcPatrolState,
  displayDurationForPatrol,
  displayStartTimeForPatrol,
  displayTitleForPatrol,
  formatPatrolStateTitleDate,
  getBoundsForPatrol,
  iconTypeForPatrol,
  patrolHasGeoDataToDisplay,
  patrolStateDetailsEndTime,
  patrolStateDetailsOverdueStartTime,
  patrolStateDetailsStartTime,
} from '../utils/patrols';
import { createPatrolDataSelector } from '../selectors/patrols';

import { PATROL_UI_STATES } from '../constants';

export default (patrolFromProps) => {
  const { patrolData, patrolTrackState, trackState } = useSelector((state) => {
    const getDataForPatrolFromProps = createPatrolDataSelector();

    return !!patrolFromProps && {
      patrolData: getDataForPatrolFromProps(state, { patrol: patrolFromProps }),
      patrolTrackState: state?.view?.patrolTrackState,
      trackState: state?.view?.subjectTrackState,
    };
  });

  const [patrolState, setPatrolState] = useState(calcPatrolState(patrolData.patrol));

  const isPatrolActive = patrolState === PATROL_UI_STATES.ACTIVE;
  const isPatrolCancelled = patrolState === PATROL_UI_STATES.CANCELLED;
  const isPatrolDone = patrolState === PATROL_UI_STATES.DONE;
  const isPatrolOverdue = patrolState === PATROL_UI_STATES.START_OVERDUE;
  const isPatrolScheduled = patrolState === PATROL_UI_STATES.READY_TO_START
    || patrolState === PATROL_UI_STATES.SCHEDULED
    || patrolState === PATROL_UI_STATES.START_OVERDUE;

  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrolData.patrol), [patrolData.patrol]);
  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrolData.patrol), [patrolData.patrol]);
  const canShowTrack = useMemo(
    () => patrolHasGeoDataToDisplay(patrolData.trackData, patrolData.startStopGeometries),
    [patrolData.startStopGeometries, patrolData.trackData]
  );
  const displayTitle = useMemo(
    () => displayTitleForPatrol(patrolData.patrol, patrolData.leader),
    [patrolData.leader, patrolData.patrol]
  );
  const patrolBounds = useMemo(() => getBoundsForPatrol(patrolData), [patrolData]);
  const patrolElapsedTime = useMemo(
    () => !!patrolState && displayDurationForPatrol(patrolData.patrol),
    [patrolData.patrol, patrolState]
  );
  const patrolIconId = useMemo(() => iconTypeForPatrol(patrolData.patrol), [patrolData.patrol]);
  const scheduledStartTime = useMemo(() => patrolStateDetailsStartTime(patrolData.patrol), [patrolData.patrol]);
  const theme = useMemo(() => calcColorThemeForPatrolState(patrolState), [patrolState]);

  const patrolCancellationTime = useMemo(() => {
    if (!isPatrolCancelled) return null;

    const cancellation = patrolData.patrol?.updates
      ?.find(update => update.type === 'update_patrol_state' && update.message.includes('cancelled'))
      ?? null;
    if (!cancellation) return null;

    return formatPatrolStateTitleDate(new Date(cancellation.time));

  }, [isPatrolCancelled, patrolData.patrol.updates]);

  const dateComponentDateString = useMemo(() => {
    if (isPatrolCancelled) return patrolCancellationTime;
    if (isPatrolDone) return patrolStateDetailsEndTime(patrolData.patrol);
    if (isPatrolOverdue) return patrolStateDetailsOverdueStartTime(patrolData.patrol);
    if (isPatrolActive || isPatrolScheduled) {
      return formatPatrolStateTitleDate(displayStartTimeForPatrol(patrolData.patrol));
    }

    return null;

  }, [
    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolOverdue,
    isPatrolScheduled,
    patrolData.patrol,
    patrolCancellationTime,
  ]);

  useEffect(() => {
    setPatrolState(calcPatrolState(patrolData.patrol));
  }, [patrolData.patrol]);

  return {
    patrolData,
    patrolTrackState,
    trackState,

    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolOverdue,
    isPatrolScheduled,

    actualEndTime,
    actualStartTime,
    canShowTrack,
    displayTitle,
    patrolBounds,
    patrolElapsedTime,
    patrolIconId,
    patrolState,
    scheduledStartTime,
    theme,

    dateComponentDateString,

    setPatrolState,
  };
};
