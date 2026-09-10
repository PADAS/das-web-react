import { isFuture } from 'date-fns';

import parseLegDraftDateTime from '../parseLegDraftDateTime';

const getIsScheduled = (dateTime, isAuto) => !!dateTime && !isAuto && isFuture(dateTime);

// TODO: Send the leg's team, members, assets and schema driven fields once
// the API defines where they live in a patrol segment.
const buildLegSegment = (leg) => {
  const endDateTime = parseLegDraftDateTime(leg.endDate, leg.endTime);
  const startDateTime = parseLegDraftDateTime(leg.startDate, leg.startTime);

  const isEndScheduled = getIsScheduled(endDateTime, leg.isAutoEnd);
  const isStartScheduled = getIsScheduled(startDateTime, leg.isAutoStart);

  return {
    end_location: leg.endLocation,
    events: [],
    leader: leg.teamLead,
    patrol_type: leg.patrolType?.value ?? null,
    priority: leg.patrolType?.default_priority ?? 0,
    scheduled_end: isEndScheduled ? endDateTime.toISOString() : null,
    scheduled_start: isStartScheduled ? startDateTime.toISOString() : null,
    start_location: leg.startLocation,
    time_range: {
      end_time: endDateTime && !isEndScheduled ? endDateTime.toISOString() : null,
      start_time: startDateTime && !isStartScheduled ? startDateTime.toISOString() : null,
    },
  };
};

export default buildLegSegment;
