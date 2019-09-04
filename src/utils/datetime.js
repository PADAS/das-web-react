
import { distanceInWords } from 'date-fns';

import { subMonths, subWeeks, subDays, startOfDay } from 'date-fns';

export const DEFAULT_FRIENDLY_DATE_FORMAT = 'Mo MMM YYYY';


export const dateIsValid = date => date instanceof Date && !isNaN(date.valueOf());

export const calcFriendlyDurationString = (from, until) => {
  if (!from && !until) return '1 month ago until now';

  if (!until) return `${distanceInWords(startOfDay(from), new Date())} ago until now`;

  if (!from) return `1 month ago until ${distanceInWords(startOfDay(until), new Date())} ago`

  return `${distanceInWords(startOfDay(from), new Date())} ago until ${distanceInWords(startOfDay(until), new Date())} ago`;
};


export const STANDARD_DATE_FORMAT = 'D MMM YYYY HH:mm';

export const generateDaysAgoDate = (daysAgo = 1) => new Date(
  startOfDay(
    subDays(new Date(), daysAgo)
  )
);

export const generateWeeksAgoDate = (weeksAgo = 1) => new Date(
  startOfDay(
    subWeeks(new Date(), weeksAgo)
  )
);

export const generateMonthsAgoDate = (monthsAgo = 1) => new Date(
  startOfDay(
    subMonths(new Date(), monthsAgo)
  )
);
