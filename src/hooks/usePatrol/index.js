import { useCallback, useEffect, useMemo, useState } from 'react';
import merge from 'lodash/merge';
import { useDispatch, useSelector } from 'react-redux';

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
  getCancellationTimeForPatrol,
  iconTypeForPatrol,
  patrolHasGeoDataToDisplay,
  patrolStateDetailsEndTime,
  patrolStateDetailsOverdueStartTime,
  patrolStateDetailsStartTime,
} from '../../utils/patrols';

import { selectPatrolTrackData } from '../../selectors/patrols';
import { PATROL_API_STATES, PATROL_UI_STATES } from '../../constants';
import { updatePatrol } from '../../ducks/patrols';

const usePatrol = (patrol) => {
  const dispatch = useDispatch();

  const patrolTrackData = useSelector((state) => selectPatrolTrackData(state, patrol));
  const patrolTrackState = useSelector(state =>  state?.view?.patrolTrackState);
  const trackState = useSelector(state => state?.view?.subjectTrackState);

  const [patrolState, setPatrolState] = useState(calcPatrolState(patrol));

  const isPatrolActive = patrolState === PATROL_UI_STATES.ACTIVE;
  const isPatrolCancelled = patrolState === PATROL_UI_STATES.CANCELLED;
  const isPatrolDone = patrolState === PATROL_UI_STATES.DONE;
  const isPatrolOverdue = patrolState === PATROL_UI_STATES.START_OVERDUE;
  const isPatrolScheduled = patrolState === PATROL_UI_STATES.READY_TO_START
    || patrolState === PATROL_UI_STATES.SCHEDULED
    || patrolState === PATROL_UI_STATES.START_OVERDUE;

  const actualEndTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);
  const actualStartTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);
  const canShowTrack = useMemo(
    () => patrolHasGeoDataToDisplay(patrolTrackData.trackData, patrolTrackData.startStopGeometries),
    [patrolTrackData.startStopGeometries, patrolTrackData.trackData]
  );
  const displayTitle = useMemo(
    () => displayTitleForPatrol(patrol, patrolTrackData.leader),
    [patrol, patrolTrackData.leader]
  );
  const patrolBounds = useMemo(() => getBoundsForPatrol(patrol, patrolTrackData), [patrol, patrolTrackData]);
  const patrolElapsedTime = useMemo(
    () => !!patrolState && displayDurationForPatrol(patrol),
    [patrol, patrolState]
  );
  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);
  const scheduledStartTime = useMemo(() => patrolStateDetailsStartTime(patrol), [patrol]);
  const theme = useMemo(() => calcColorThemeForPatrolState(patrolState), [patrolState]);

  const patrolCancellationTime = useMemo(() => {
    const cancellationTimeForPatrol = getCancellationTimeForPatrol(patrol);

    return cancellationTimeForPatrol ? formatPatrolStateTitleDate(cancellationTimeForPatrol) : null;
  }, [patrol]);

  const dateComponentDateString = useMemo(() => {
    if (isPatrolCancelled) return patrolCancellationTime;
    if (isPatrolDone) return patrolStateDetailsEndTime(patrol);
    if (isPatrolOverdue) return patrolStateDetailsOverdueStartTime(patrol);
    if (isPatrolActive || isPatrolScheduled) {
      return formatPatrolStateTitleDate(displayStartTimeForPatrol(patrol));
    }

    return null;

  }, [
    isPatrolActive,
    isPatrolCancelled,
    isPatrolDone,
    isPatrolOverdue,
    isPatrolScheduled,
    patrol,
    patrolCancellationTime,
  ]);

  useEffect(() => {
    setPatrolState(calcPatrolState(patrol));
  }, [patrol]);

  const onPatrolChange = useCallback((value) => {
    const merged = merge(patrol, value);
    const payload = { ...merged };
    delete payload.updates;

    dispatch(updatePatrol(payload));
  }, [dispatch, patrol]);

  const restorePatrol = useCallback(() => {
    onPatrolChange({ state: PATROL_API_STATES.OPEN, patrol_segments: [{ time_range: { end_time: null } }] });
  }, [onPatrolChange]);

  const startPatrol = useCallback(() => {
    onPatrolChange({
      state: PATROL_API_STATES.OPEN,
      patrol_segments: [{ time_range: { start_time: new Date().toISOString(), end_time: null } }],
    });
  }, [onPatrolChange]);

  return {
    patrolTrackData,
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

    onPatrolChange,
    restorePatrol,
    startPatrol,
  };
};

export default usePatrol;
