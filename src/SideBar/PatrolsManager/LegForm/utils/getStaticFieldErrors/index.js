import i18next from 'i18next';

import { isValidDate } from '../../../../../DatePicker';
import parseLegDraftDateTime from '../parseLegDraftDateTime';

const getStaticFieldErrors = (leg) => {
  const t = i18next.getFixedT(null, 'patrols', 'legForm.staticFields');

  if (!isValidDate(leg.startDate)) {
    return { startDate: t('startDateRequiredError') };
  }

  const endDateTime = parseLegDraftDateTime(leg.endDate, leg.endTime);
  const startDateTime = parseLegDraftDateTime(leg.startDate, leg.startTime);

  if (endDateTime && endDateTime < startDateTime) {
    return { endDate: t('endDateBeforeStartDateError') };
  }

  return {};
};

export default getStaticFieldErrors;
