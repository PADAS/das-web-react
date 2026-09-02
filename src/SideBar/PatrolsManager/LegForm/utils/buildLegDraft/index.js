import { format } from 'date-fns';

import { EMPTY_DATE_VALUE } from '../../../../../DatePicker';
import { findMatchingPatrolType } from '../../../../../utils/patrols';
import { getHoursAndMinutesString } from '../../../../../utils/datetime';

const buildLegDraft = (leg = null, patrolTypes = []) => {
  const actualEndTime = leg?.time_range?.end_time ?? null;
  const actualStartTime = leg?.time_range?.start_time ?? null;
  const endTime = actualEndTime ?? leg?.scheduled_end ?? null;
  const startTime = actualStartTime ?? leg?.scheduled_start ?? null;

  const endDate = endTime ? new Date(endTime) : null;
  const startDate = startTime ? new Date(startTime) : null;

  const activePatrolTypes = patrolTypes.filter(({ is_active }) => is_active);

  return {
    assets: [],
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : EMPTY_DATE_VALUE,
    endLocation: leg?.end_location ?? null,
    endTime: getHoursAndMinutesString(endDate),
    isAutoEnd: !!actualEndTime,
    isAutoStart: !!actualStartTime,
    patrolType: findMatchingPatrolType(activePatrolTypes, leg?.patrol_type) ?? null,
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : EMPTY_DATE_VALUE,
    startLocation: leg?.start_location ?? null,
    startTime: getHoursAndMinutesString(startDate),
    team: null,
    teamLead: leg?.leader ?? null,
    teamMembers: [],
    typeDetails: {},
    universalDetails: {},
  };
};

export default buildLegDraft;
