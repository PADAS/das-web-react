import { calcPatrolState, getIsMobilePatrol } from '../../../../../utils/patrols';
import { PATROL_UI_STATES } from '../../../../../constants';

import buildPatrolReopenUpdate from '../buildPatrolReopenUpdate';

const { ACTIVE, CANCELLED, DONE, INVALID, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

// An active mobile patrol can only be ended from the web client.
const ACTIVE_MOBILE_PATROL_STATES = [DONE];

const STATES_BY_PATROL_STATE = {
  [ACTIVE.key]: [CANCELLED, PAUSED, DONE],
  [PAUSED.key]: [ACTIVE, CANCELLED, DONE],
  [READY_TO_START.key]: [ACTIVE, CANCELLED],
  [SCHEDULED.key]: [ACTIVE, CANCELLED],
  [START_OVERDUE.key]: [ACTIVE, CANCELLED],
  [INVALID.key]: [],
};

const getPatrolStatusOptions = (patrol, patrolState) => {
  const isPatrolOver = patrolState === CANCELLED || patrolState === DONE;

  const states = isPatrolOver
    ? [calcPatrolState({ ...patrol, ...buildPatrolReopenUpdate(patrol) })]
    : STATES_BY_PATROL_STATE[patrolState.key] ?? [];

  const allowedStates = getIsMobilePatrol(patrol) && patrolState === ACTIVE
    ? states.filter((state) => ACTIVE_MOBILE_PATROL_STATES.includes(state))
    : states;

  return [patrolState, ...allowedStates];
};

export default getPatrolStatusOptions;
