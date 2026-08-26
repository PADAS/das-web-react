import { PATROL_API_STATES } from '../../../../../constants';

import withLastSegmentTimeRange from '../withLastSegmentTimeRange';

const buildPatrolReopenUpdate = (patrol) => ({
  state: PATROL_API_STATES.OPEN,
  patrol_segments: withLastSegmentTimeRange(patrol, { end_time: null }),
});

export default buildPatrolReopenUpdate;
