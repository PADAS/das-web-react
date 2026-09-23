import buildPatrolStatusUpdate from '../buildPatrolStatusUpdate';
import {
  buildPatrolReopenUpdate,
  calcPatrolState,
  getIsMobilePatrol,
  isPatrolStateUnderWay,
  patrolWithUpdateApplied,
} from '../../../../../utils/patrols';
import { PATROL_UI_STATES } from '../../../../../constants';

const { ACTIVE, CANCELLED, DONE, INVALID, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

// A mobile patrol under way can only be ended from the web client.
const MOBILE_PATROL_UNDER_WAY_STATES = [DONE];

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
    ? [calcPatrolState(patrolWithUpdateApplied(patrol, buildPatrolReopenUpdate(patrol)))]
      .filter((state) => state !== INVALID)
    : STATES_BY_PATROL_STATE[patrolState.key] ?? [];

  const allowedStates = getIsMobilePatrol(patrol) && isPatrolStateUnderWay(patrolState)
    ? states.filter((state) => MOBILE_PATROL_UNDER_WAY_STATES.includes(state))
    : states;

  // A state this patrol has no update to reach is not a state to offer.
  return [patrolState, ...allowedStates.filter((state) => !!buildPatrolStatusUpdate(patrol, state))];
};

export default getPatrolStatusOptions;
