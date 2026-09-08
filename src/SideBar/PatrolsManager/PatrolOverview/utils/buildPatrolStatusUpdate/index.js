import {
  buildPatrolEndUpdate,
  buildPatrolPauseUpdate,
  buildPatrolReopenUpdate,
  buildPatrolResumeUpdate,
  buildPatrolStartUpdate,
  calcPatrolState,
  isPatrolPaused,
  patrolWithUpdateApplied,
} from '../../../../../utils/patrols';
import { PATROL_API_STATES, PATROL_UI_STATES } from '../../../../../constants';

const buildPatrolStatusUpdate = (patrol, state) => {
  if (state === PATROL_UI_STATES.CANCELLED) {
    return { state: PATROL_API_STATES.CANCELLED };
  }

  if (state === PATROL_UI_STATES.DONE) {
    return buildPatrolEndUpdate(patrol);
  }

  // A patrol that reaches the picked state as soon as its close is cleared was
  // already there: reopening it is the whole of the change.
  const reopenUpdate = buildPatrolReopenUpdate(patrol);
  if (calcPatrolState(patrolWithUpdateApplied(patrol, reopenUpdate)) === state) {
    return reopenUpdate;
  }

  if (state === PATROL_UI_STATES.ACTIVE) {
    // Coming back from a pause is the pause leg ending and the leg it
    // interrupted resuming, not the patrol starting over.
    return isPatrolPaused(patrol) ? buildPatrolResumeUpdate(patrol) : buildPatrolStartUpdate(patrol);
  }

  if (state === PATROL_UI_STATES.PAUSED) {
    return buildPatrolPauseUpdate(patrol);
  }

  // The states left are the ones a patrol that never started falls back to
  // once it is reopened.
  return reopenUpdate;
};

export default buildPatrolStatusUpdate;
