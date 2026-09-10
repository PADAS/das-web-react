import { isFuture } from 'date-fns';
import uniq from 'lodash/uniq';

import parseLegDraftDateTime from '../parseLegDraftDateTime';

const getIsScheduled = (dateTime, isAuto) => !!dateTime && !isAuto && isFuture(dateTime);

// Only the first leg's start may be left as a plan: starting the patrol is what
// fulfils a scheduled start, and that only ever touches the first leg.
const buildLegSegment = (leg, { isFirstLeg = true } = {}) => {
  const endDateTime = parseLegDraftDateTime(leg.endDate, leg.endTime);
  const startDateTime = parseLegDraftDateTime(leg.startDate, leg.startTime);

  const isEndScheduled = getIsScheduled(endDateTime, leg.isAutoEnd);
  const isStartScheduled = isFirstLeg && getIsScheduled(startDateTime, leg.isAutoStart);

  return {
    assets: leg.assets.map(({ id }) => id),
    end_location: leg.endLocation,
    events: [],
    leader: leg.teamLead,
    // The API rejects a lead who is not one of the members.
    members: uniq([...(leg.teamLead ? [leg.teamLead.id] : []), ...leg.teamMembers.map(({ id }) => id)]),
    patrol_type: leg.patrolType?.value ?? null,
    priority: leg.patrolType?.default_priority ?? 0,
    scheduled_end: isEndScheduled ? endDateTime.toISOString() : null,
    scheduled_start: isStartScheduled ? startDateTime.toISOString() : null,
    segment_details: leg.universalDetails,
    start_location: leg.startLocation,
    team: leg.team?.id ?? null,
    time_range: {
      end_time: endDateTime && !isEndScheduled ? endDateTime.toISOString() : null,
      start_time: startDateTime && !isStartScheduled ? startDateTime.toISOString() : null,
    },
    type_details: leg.typeDetails,
  };
};

export default buildLegSegment;
