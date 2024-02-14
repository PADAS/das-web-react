import humanizeDuration from 'humanize-duration';
import pluralize from 'pluralize';
import {
  formatDistance as distanceInWords,
  subMonths,
  subWeeks,
  subDays,
  startOfDay,
  endOfDay,
  format as formatDate,
  setSeconds,
  setMilliseconds,
  isFuture
} from 'date-fns';
import i18next from 'i18next';

import { DATE_LOCALES } from '../constants';

export const DEFAULT_FRIENDLY_DATE_FORMAT = 'Mo MMM YYYY';
export const EVENT_SYMBOL_DATE_FORMAT = 'DD MMM YY';


export const format = (date, format) => {
  const { language } = i18next;
  const locale = DATE_LOCALES[language];

  return formatDate(date, format, {
    locale,
    useAdditionalWeekYearTokens: true,
    useAdditionalDayOfYearTokens: true,
  });
};

export const dateIsValid = date => date instanceof Date && !isNaN(date.valueOf());

export const calcFriendlyDurationString = (from, until) => {
  const locale = DATE_LOCALES[i18next.language];
  const t = i18next.getFixedT(null, 'filters', 'friendlyFilterString');

  if (!from && !until) return t('monthAgo');

  if (!until){
    return t('untilNow', {
      date: distanceInWords(startOfDay(from), new Date(), { locale })
    });
  }

  if (!from){
    return t('monthAgoUntilNow', {
      date: distanceInWords(startOfDay(until), new Date(), { locale })
    });
  }

  const untilIsFuture = isFuture(until);
  const untilDate = untilIsFuture ? new Date(until) : startOfDay(new Date(until));

  const fromDistanceInWords = distanceInWords(startOfDay(from), new Date(), { locale });
  const untilDistanceInWords = distanceInWords(untilDate, new Date(), { locale });

  return t(untilIsFuture ? 'someAgoFromNow' : 'someAgo', {
    from: fromDistanceInWords,
    until: untilDistanceInWords
  });
};

export const SHORT_TIME_FORMAT = 'HH:mm';
export const STANDARD_DATE_FORMAT = 'D MMM YY HH:mm';
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
  if (!date) return '';
  const dateMinutes = (new Date(date).getMinutes()<10?'0':'') + new Date(date).getMinutes();
  const dateHours = (new Date(date).getHours()<10?'0':'') + new Date(date).getHours();
  return `${dateHours}:${dateMinutes}`;
};

const DEFAULT_HUMANIZED_DURATION_PROPS = {
  delimiter: ' ',
  maxDecimalPoints: 0,
};

export const HUMANIZED_DURATION_CONFIGS = {
  FULL_FORMAT: (language = 'en') => ({
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language,
    units: ['y', 'mo', 'd', 'h', 'm', 's'],
  }),
  MINUTES_ONLY: (minutesLabel) => ({ // 'minute'
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'minutes_only',
    languages: {
      minutes_only: {
        m: (n) => pluralize(minutesLabel, n),
      },
    },
    units: ['m'],
    spacer: ' ',
  }),
  ABBREVIATED_FORMAT: (abbreviations) => ({
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'abbreviated',
    languages: {
      abbreviated: abbreviations,
    },
    units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
    spacer: '',
  }),
  LONG_TERM_ABRREVIATED: (abbreviations) => ({
    ...DEFAULT_HUMANIZED_DURATION_PROPS,
    language: 'long_term',
    languages: {
      long_term: abbreviations,
    },
    units: ['y', 'mo', 'w', 'd', 'h', 'm'],
    spacer: '',
  })
};

export const durationHumanizer = (config = HUMANIZED_DURATION_CONFIGS.FULL_FORMAT()) => humanizeDuration.humanizer(config);

export const getUserLocaleTime = (date = new Date()) => {
  const userLanguage = navigator.languages?.[0]
    || navigator.userLanguage
    || navigator.language
    || navigator.browserLanguage
    || 'en-US';

  return date.toLocaleTimeString(userLanguage, { hour: '2-digit', minute: '2-digit' });
};

export const isGreaterThan = (date1, date2) => date1.getTime() > date2.getTime();

