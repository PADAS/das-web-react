
import distanceInWords from 'date-fns/distance_in_words';
import subMonths from 'date-fns/sub_months';
import subWeeks from 'date-fns/sub_weeks';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';
import endOfDay from 'date-fns/end_of_day';
import format from 'date-fns/format';
import setSeconds from 'date-fns/set_seconds';
import setMilliseconds from 'date-fns/set_milliseconds';
import isFuture from 'date-fns/is_future';
import humanizeDuration from 'humanize-duration';
import pluralize from 'pluralize';

export const DEFAULT_FRIENDLY_DATE_FORMAT = 'Mo MMM YYYY';

export const EVENT_SYMBOL_DATE_FORMAT = 'DD MMM YY';


export const dateIsValid = date => date instanceof Date && !isNaN(date.valueOf());

export const calcFriendlyDurationString = (from, until) => {
  if (!from && !until) return '1 month ago until now';

  if (!until) return `${distanceInWords(startOfDay(from), new Date())} ago until now`;

  if (!from) return `1 month ago until ${distanceInWords(startOfDay(until), new Date())} ago`;

  const untilIsFuture = isFuture(until);
  const untilDate = untilIsFuture ? new Date(until) : startOfDay(new Date(until));

  return `${distanceInWords(startOfDay(from), new Date())} ago until ${distanceInWords(untilDate, new Date())}${untilIsFuture ? ' from now' : ' ago'}`;
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
export const endOfTime = () => new Date(8640000000000000);

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

export const getHoursAndMinutesString = (date) => {
  if (!date) return null;
  const dateMinutes = (new Date(date).getMinutes()<10?'0':'') + new Date(date).getMinutes();
  const dateHours = (new Date(date).getHours()<10?'0':'') + new Date(date).getHours();
  return `${dateHours}:${dateMinutes}`;
};

const DEFAULT_HUMANIZED_DURATION_PROPS = {
  delimiter: ' ',
  maxDecimalPoints: 0,
};

export const HUMANIZED_DURATION_CONFIGS = {
  FULL_FORMAT: {
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'en',
    units: ['y', 'mo', 'd', 'h', 'm', 's'],
  },
  MINUTES_ONLY: {
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'minutes_only',
    languages: {
      minutes_only: {
        m: (n) => pluralize('minute', n),
      },
    },
    units: ['m'],
    spacer: ' ',
  },
  ABBREVIATED_FORMAT: {
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'abbreviated',
    languages: {
      abbreviated: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
        s: () => 's',
      },
    },
    units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
    spacer: '',
  },
  LONG_TERM_ABRREVIATED: {
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'long_term',
    languages: {
      long_term: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
      },
    },
    units: ['y', 'mo', 'w', 'd', 'h', 'm'],
    spacer: '',
  }
};

export const durationHumanizer = (config = HUMANIZED_DURATION_CONFIGS.FULL_FORMAT) => humanizeDuration.humanizer(config);
