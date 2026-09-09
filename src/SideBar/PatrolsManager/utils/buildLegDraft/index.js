import { format } from 'date-fns';

import { EMPTY_DATE_VALUE } from '../../../../DatePicker';
import { findMatchingPatrolType, getTeamAndTrackingForPatrolSegment } from '../../../../utils/patrols';
import { getHoursAndMinutesString } from '../../../../utils/datetime';

// A leg keeps the type it was run under even once that type is retired, so
// one the form no longer offers is rebuilt from what the leg itself stores.
const patrolTypeForPatrolSegment = (patrolSegment, patrolTypes) => {
  if (!patrolSegment?.patrol_type) {
    return null;
  }

  return findMatchingPatrolType(patrolTypes, patrolSegment.patrol_type)
    ?? { display: patrolSegment.patrol_type, icon_id: patrolSegment.icon_id, value: patrolSegment.patrol_type };
};

const buildLegDraft = (patrolSegment = null, patrolTypes = [], teamAndTrackingOptions) => {
  const actualEndTime = patrolSegment?.time_range?.end_time ?? null;
  const actualStartTime = patrolSegment?.time_range?.start_time ?? null;
  const endTime = actualEndTime ?? patrolSegment?.scheduled_end ?? null;
  const startTime = actualStartTime ?? patrolSegment?.scheduled_start ?? null;

  const endDate = endTime ? new Date(endTime) : null;
  const startDate = startTime ? new Date(startTime) : null;

  const teamAndTracking = getTeamAndTrackingForPatrolSegment(patrolSegment, teamAndTrackingOptions);

  return {
    assets: teamAndTracking.assets,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : EMPTY_DATE_VALUE,
    endLocation: patrolSegment?.end_location ?? null,
    endTime: getHoursAndMinutesString(endDate),
    isAutoEnd: !!actualEndTime,
    isAutoStart: !!actualStartTime,
    patrolType: patrolTypeForPatrolSegment(patrolSegment, patrolTypes),
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : EMPTY_DATE_VALUE,
    startLocation: patrolSegment?.start_location ?? null,
    startTime: getHoursAndMinutesString(startDate),
    team: teamAndTracking.team,
    teamLead: patrolSegment?.leader ?? null,
    teamMembers: teamAndTracking.members,
    typeDetails: patrolSegment?.type_details ?? {},
    universalDetails: patrolSegment?.segment_details ?? {},
  };
};

export default buildLegDraft;
