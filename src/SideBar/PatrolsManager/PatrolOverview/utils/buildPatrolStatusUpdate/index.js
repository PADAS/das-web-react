import { PATROL_API_STATES, PATROL_UI_STATES } from '../../../../../constants';

import buildPatrolReopenUpdate from '../buildPatrolReopenUpdate';
import withLastSegmentTimeRange from '../withLastSegmentTimeRange';

const buildPatrolStatusUpdate = (patrol, state) => {
  switch (state) {
  case PATROL_UI_STATES.CANCELLED:
    return { state: PATROL_API_STATES.CANCELLED };

  case PATROL_UI_STATES.DONE:
    return {
      state: PATROL_API_STATES.DONE,
      patrol_segments: withLastSegmentTimeRange(patrol, { end_time: new Date().toISOString() }),
    };

  case PATROL_UI_STATES.ACTIVE:
    // A patrol that already has a start time is coming back from being ended, so reopening it is
    // enough to make it active again.
    return patrol.patrol_segments.at(-1)?.time_range?.start_time
      ? buildPatrolReopenUpdate(patrol)
      : {
        state: PATROL_API_STATES.OPEN,
        patrol_segments: withLastSegmentTimeRange(
          patrol,
          { start_time: new Date().toISOString(), end_time: null }
        ),
      };

  // TODO: Build the paused update once the API models paused patrols. Coming back from it has to
  // copy the paused leg, so neither side can be expressed as a time range change on the last leg.
  case PATROL_UI_STATES.PAUSED:
    return null;

  // The states left are the ones a patrol that never started falls back to
  // once it is reopened.
  default:
    return buildPatrolReopenUpdate(patrol);
  }
};

export default buildPatrolStatusUpdate;
