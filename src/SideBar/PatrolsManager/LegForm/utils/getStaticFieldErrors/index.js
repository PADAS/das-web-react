import i18next from 'i18next';

import { isValidDate } from '../../../../../DatePicker';
import { isValidTime } from '../../../../../TimePicker';
import parseLegDraftDateTime from '../parseLegDraftDateTime';

const getStaticFieldErrors = (leg, earliestStartDateTime = null, latestEndDateTime = null) => {
  const t = i18next.getFixedT(null, 'patrols', 'legForm');

  if (!isValidDate(leg.startDate)) {
    return { startDate: t('staticFields.startDateRequiredError') };
  }

  // A date whose time is left incomplete would be read as midnight, an hour the
  // user never picked.
  if (!isValidTime(leg.startTime)) {
    return { startTime: t('staticFields.startTimeRequiredError') };
  }

  const startDateTime = parseLegDraftDateTime(leg.startDate, leg.startTime);

  // Legs run one after the other, so a leg may begin the moment the previous
  // one ends but never before it.
  if (earliestStartDateTime && startDateTime < earliestStartDateTime) {
    return { startDate: t('staticFields.startDateOverlapsPreviousLegError') };
  }

  // Neither bound of the leg may pass the start of the leg after it.
  if (latestEndDateTime && startDateTime > latestEndDateTime) {
    return { startDate: t('staticFields.startDateOverlapsNextLegError') };
  }

  if (isValidDate(leg.endDate) && !isValidTime(leg.endTime)) {
    return { endTime: t('staticFields.endTimeRequiredError') };
  }

  const endDateTime = parseLegDraftDateTime(leg.endDate, leg.endTime);

  if (endDateTime && endDateTime < startDateTime) {
    return { endDate: t('staticFields.endDateBeforeStartDateError') };
  }

  if (endDateTime && latestEndDateTime && endDateTime > latestEndDateTime) {
    return { endDate: t('staticFields.endDateOverlapsNextLegError') };
  }

  if (!leg.patrolType) {
    return { patrolType: t('patrolTypeField.requiredError') };
  }

  return {};
};

export default getStaticFieldErrors;
