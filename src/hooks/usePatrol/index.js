import { useCallback, useEffect, useMemo, useState } from 'react';
import merge from 'lodash/merge';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

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
} from '../../utils/patrols';

import { createPatrolDataSelector } from '../../selectors/patrols';
import { PATROL_API_STATES, PATROL_UI_STATES } from '../../constants';
import { updatePatrol } from '../../ducks/patrols';

const usePatrol = (patrolFromProps) => {
  const dispatch = useDispatch();

  const getDataForPatrolFromProps = useMemo(createPatrolDataSelector, []);
  const patrolFromPropsObject = useMemo(() => ({ patrol: patrolFromProps }), [patrolFromProps]);

  const patrolData = useSelector((state) => getDataForPatrolFromProps(state, patrolFromPropsObject));
  const patrolTrackState = useSelector(state =>  state?.view?.patrolTrackState);
  const trackState = useSelector(state => state?.view?.subjectTrackState);

  const [patrolState, setPatrolState] = useState(calcPatrolState(patrolData.patrol));

  const { i18n: { language } } = useTranslation();

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
    () => !!patrolState && displayDurationForPatrol(patrolData.patrol, language),
    [patrolData.patrol, patrolState, language]
  );
  const patrolIconId = useMemo(() => iconTypeForPatrol(patrolData.patrol), [patrolData.patrol]);
  const scheduledStartTime = useMemo(() => patrolStateDetailsStartTime(patrolData.patrol, language), [patrolData.patrol, language]);
  const theme = useMemo(() => calcColorThemeForPatrolState(patrolState), [patrolState]);

  const patrolCancellationTime = useMemo(() => {
    if (!isPatrolCancelled) return null;

    const cancellation = patrolData.patrol?.updates
      ?.find(update => update.type === 'update_patrol_state' && update.message.includes('cancelled'))
      ?? null;
    if (!cancellation) return null;

    return formatPatrolStateTitleDate(new Date(cancellation.time), language);

  }, [isPatrolCancelled, patrolData.patrol.updates, language]);

  const dateComponentDateString = useMemo(() => {
    if (isPatrolCancelled) return patrolCancellationTime;
    if (isPatrolDone) return patrolStateDetailsEndTime(patrolData.patrol, language);
    if (isPatrolOverdue) return patrolStateDetailsOverdueStartTime(patrolData.patrol, language);
    if (isPatrolActive || isPatrolScheduled) {
      return formatPatrolStateTitleDate(displayStartTimeForPatrol(patrolData.patrol), language);
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
    language
  ]);

  useEffect(() => {
    setPatrolState(calcPatrolState(patrolData.patrol));
  }, [patrolData.patrol]);

  const onPatrolChange = useCallback((value) => {
    const merged = merge(patrolFromProps, value);
    const payload = { ...merged };
    delete payload.updates;

    dispatch(updatePatrol(payload));
  }, [dispatch, patrolFromProps]);

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

    onPatrolChange,
    restorePatrol,
    startPatrol,
  };
};

export default usePatrol;
