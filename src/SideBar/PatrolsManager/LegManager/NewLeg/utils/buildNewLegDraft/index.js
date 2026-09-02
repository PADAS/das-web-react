import { format } from 'date-fns';

import buildLegDraft from '../../../../LegForm/utils/buildLegDraft';
import { displayEndTimeForPatrolSegment, earliestStartAfterPatrolSegment } from '../../../../../../utils/patrols';
import { EMPTY_DATE_VALUE } from '../../../../../../DatePicker';
import { getHoursAndMinutesString } from '../../../../../../utils/datetime';

// A leg begins where the one before it ends. While that end is unset it begins
// now, or where the previous leg's own plan starts when that is still ahead.
const getStartDate = (previousLeg) => {
  const now = new Date();

  if (!previousLeg) {
    return now;
  }

  const earliestStart = earliestStartAfterPatrolSegment(previousLeg);

  if (displayEndTimeForPatrolSegment(previousLeg)) {
    return earliestStart;
  }

  return earliestStart && earliestStart > now ? earliestStart : now;
};

const buildNewLegDraft = ({ isAutoEnd, isAutoStart, patrolTypes, previousLeg }) => {
  const startDate = getStartDate(previousLeg);

  return {
    // The new leg carries on the previous plan, so everything comes from it
    // but the schedule and the places, which are this leg's alone.
    ...buildLegDraft(previousLeg, patrolTypes),
    endDate: EMPTY_DATE_VALUE,
    endLocation: null,
    endTime: '',
    isAutoEnd,
    isAutoStart,
    startDate: format(startDate, 'yyyy-MM-dd'),
    startLocation: null,
    startTime: getHoursAndMinutesString(startDate),
  };
};

export default buildNewLegDraft;
