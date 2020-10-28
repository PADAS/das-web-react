
import distanceInWords from 'date-fns/distance_in_words';
import subMonths from 'date-fns/sub_months';
import subWeeks from 'date-fns/sub_weeks';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';
import endOfDay from 'date-fns/end_of_day';
import format from 'date-fns/format';
import setSeconds from 'date-fns/set_seconds';
import setMilliseconds from 'date-fns/set_milliseconds';

export const DEFAULT_FRIENDLY_DATE_FORMAT = 'Mo MMM YYYY';

export const EVENT_SYMBOL_DATE_FORMAT = 'DD MMM YY';

export const dateIsValid = date => date instanceof Date && !isNaN(date.valueOf());

export const calcFriendlyDurationString = (from, until) => {
  if (!from && !until) return '1 month ago until now';

  if (!until) return `${distanceInWords(startOfDay(from), new Date())} ago until now`;

  if (!from) return `1 month ago until ${distanceInWords(startOfDay(until), new Date())} ago`;

  return `${distanceInWords(startOfDay(from), new Date())} ago until ${distanceInWords(startOfDay(until), new Date())} ago`;
};

export const SHORT_TIME_FORMAT = 'HH:mm';
export const STANDARD_DATE_FORMAT = 'D MMM \'YY HH:mm';
export const SHORTENED_DATE_FORMAT = STANDARD_DATE_FORMAT.replace(' HH:mm', '');


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

export const startOfToday = () => startOfDay(new Date());
export const endOfToday = () => endOfDay(new Date());

export const formatEventSymbolDate = (dateString) => format(new Date(dateString), EVENT_SYMBOL_DATE_FORMAT);

export const generateCurrentTimeZoneTitle = () => `Date displayed in the ${window.Intl.DateTimeFormat().resolvedOptions().timeZone} time zone`;

export const timeValuesAreEqualToTheMinute = (val1, val2) => {
  const flattenDate = date => setSeconds(
    setMilliseconds(
      new Date(date),
      0),
    0);
  
  return flattenDate(val1).getTime() === flattenDate(val2).getTime();
};
