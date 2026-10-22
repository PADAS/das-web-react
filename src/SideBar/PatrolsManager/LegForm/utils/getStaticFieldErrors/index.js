import i18next from 'i18next';

import { isValidDate } from '../../../../../DatePicker';
import { isValidTime } from '../../../../../TimePicker';
import parseLegDraftDateTime from '../parseLegDraftDateTime';
import timeKeepingItsSeconds from '../../../utils/timeKeepingItsSeconds';

const getStaticFieldErrors = (leg, {
  earliestStartDateTime = null,
  editedPatrolSegment = null,
  latestEndDateTime = null,
  nextLegStartDateTime = null,
  previousLegStartDateTime = null,
} = {}) => {
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

  // The API erases a time range that ends where it starts, so the times are
  // compared as they will be saved: an edited leg keeps its stored seconds.
  const savedStartTime = new Date(
    timeKeepingItsSeconds(startDateTime, editedPatrolSegment?.time_range?.start_time)
  );

  // Legs run one after the other, so a leg may begin the moment the previous
  // one ends but never before it.
  if (earliestStartDateTime && startDateTime < earliestStartDateTime) {
    return { startDateTime: t('staticFields.startDateOverlapsPreviousLegError') };
  }

  // A leg that begins with the previous one leaves that leg no time to run.
  if (previousLegStartDateTime && savedStartTime.getTime() === previousLegStartDateTime.getTime()) {
    return { startDateTime: t('staticFields.startDateMatchesPreviousLegStartError') };
  }

  // Neither bound of the leg may pass the start of the leg after it.
  if (latestEndDateTime && startDateTime > latestEndDateTime) {
    return { startDateTime: t('staticFields.startDateOverlapsNextLegError') };
  }

  // A leg that begins with the next one has no time to run before it takes over.
  if (nextLegStartDateTime && savedStartTime.getTime() === nextLegStartDateTime.getTime()) {
    return { startDateTime: t('staticFields.startDateMatchesNextLegStartError') };
  }

  // A leg left without an end would keep running beside the next one.
  if (nextLegStartDateTime && !isValidDate(leg.endDate)) {
    return { endDateTime: t('staticFields.endDateRequiredError') };
  }

  if (isValidDate(leg.endDate) && !isValidTime(leg.endTime)) {
    return { endTime: t('staticFields.endTimeRequiredError') };
  }

  const endDateTime = parseLegDraftDateTime(leg.endDate, leg.endTime);

  const savedEndTime = timeKeepingItsSeconds(endDateTime, editedPatrolSegment?.time_range?.end_time);

  if (endDateTime && new Date(savedEndTime) <= savedStartTime) {
    return { endDateTime: t('staticFields.endDateNotAfterStartDateError') };
  }

  if (endDateTime && latestEndDateTime && endDateTime > latestEndDateTime) {
    return { endDateTime: t('staticFields.endDateOverlapsNextLegError') };
  }

  if (!leg.patrolType) {
    return { patrolType: t('patrolTypeField.requiredError') };
  }

  return {};
};

export default getStaticFieldErrors;
