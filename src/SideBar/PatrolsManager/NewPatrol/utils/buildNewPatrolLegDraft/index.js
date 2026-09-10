import { format } from 'date-fns';

import buildLegDraft from '../../../LegForm/utils/buildLegDraft';
import { getHoursAndMinutesString } from '../../../../../utils/datetime';

const buildNewPatrolLegDraft = ({ isAutoEnd, isAutoStart, patrolData, patrolType }) => {
  const startDate = patrolData?.time ? new Date(patrolData.time) : new Date();

  return {
    ...buildLegDraft(),
    isAutoEnd,
    isAutoStart,
    patrolType,
    startDate: format(startDate, 'yyyy-MM-dd'),
    startLocation: patrolData?.location ?? null,
    startTime: getHoursAndMinutesString(startDate),
  };
};

export default buildNewPatrolLegDraft;
