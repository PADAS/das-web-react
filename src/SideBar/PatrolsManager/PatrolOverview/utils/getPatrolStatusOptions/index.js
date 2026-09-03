import { buildPatrolReopenUpdate, calcPatrolState, getIsMobilePatrol } from '../../../../../utils/patrols';
import { PATROL_UI_STATES } from '../../../../../constants';

const { ACTIVE, CANCELLED, DONE, INVALID, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

// An active mobile patrol can only be ended from the web client.
const ACTIVE_MOBILE_PATROL_STATES = [DONE];

const STATES_BY_PATROL_STATE = {
  [ACTIVE.key]: [CANCELLED, PAUSED, DONE],
  [INVALID.key]: [],
  [PAUSED.key]: [ACTIVE, CANCELLED, DONE],
  [READY_TO_START.key]: [ACTIVE, CANCELLED],
  [SCHEDULED.key]: [ACTIVE, CANCELLED],
  [START_OVERDUE.key]: [ACTIVE, CANCELLED],
};

const getPatrolStatusOptions = (patrol, patrolState) => {
  const isPatrolOver = patrolState === CANCELLED || patrolState === DONE;

  // A patrol that is over can only go back to the state reopening it lands on,
  // and there is no going back to a state the patrol could not be left in.
  const states = isPatrolOver
    ? [calcPatrolState({ ...patrol, ...buildPatrolReopenUpdate(patrol) })].filter((state) => state !== INVALID)
    : STATES_BY_PATROL_STATE[patrolState.key] ?? [];

  const allowedStates = getIsMobilePatrol(patrol) && patrolState === ACTIVE
    ? states.filter((state) => ACTIVE_MOBILE_PATROL_STATES.includes(state))
    : states;

  return [patrolState, ...allowedStates];
};

export default getPatrolStatusOptions;
