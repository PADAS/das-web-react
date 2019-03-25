import { STATUSES } from '../constants';

const { HEALTHY_STATUS, UNHEALTHY_STATUS, WARNING_STATUS, UNKNOWN_STATUS } = STATUSES;

const worstToBest = [UNKNOWN_STATUS, UNHEALTHY_STATUS, WARNING_STATUS, HEALTHY_STATUS];

const calcWorstCaseStatus = (systemStatus) => {
  const statusArray = Object.entries(systemStatus)
    .reduce((accumulator, [key, value]) => {
    if (key === 'services') return [...accumulator, ...value];
    return [...accumulator, value];
  }, [])
  .map(({ status }) => status);

  return worstToBest.find(item => statusArray.includes(item));
};

export const calcPrimaryStatusIndicator = (systemStatus) => {
  const worstStatus = calcWorstCaseStatus(systemStatus);
  if (worstStatus === UNKNOWN_STATUS) return UNHEALTHY_STATUS;
  return worstStatus;
};