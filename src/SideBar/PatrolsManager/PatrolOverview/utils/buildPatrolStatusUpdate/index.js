import {
  buildPatrolEndUpdate,
  buildPatrolReopenUpdate,
  buildPatrolStartUpdate,
  calcPatrolState,
} from '../../../../../utils/patrols';
import { PATROL_API_STATES, PATROL_UI_STATES } from '../../../../../constants';

const buildPatrolStatusUpdate = (patrol, state) => {
  switch (state) {
  case PATROL_UI_STATES.CANCELLED:
    return { state: PATROL_API_STATES.CANCELLED };

  case PATROL_UI_STATES.DONE:
    return buildPatrolEndUpdate(patrol);

  case PATROL_UI_STATES.ACTIVE: {
    // A patrol that turns active on its own once its end time is cleared was
    // already running, so reopening it is enough.
    const reopenUpdate = buildPatrolReopenUpdate(patrol);

    return calcPatrolState({ ...patrol, ...reopenUpdate }) === PATROL_UI_STATES.ACTIVE
      ? reopenUpdate
      : buildPatrolStartUpdate(patrol);
  }

  // TODO: Build the paused update once the API models paused patrols. Neither
  // direction is a time range change: resuming has to copy the paused leg.
  case PATROL_UI_STATES.PAUSED:
    return null;

  // The states left are the ones a patrol that never started falls back to
  // once it is reopened.
  default:
    return buildPatrolReopenUpdate(patrol);
  }
};

export default buildPatrolStatusUpdate;
