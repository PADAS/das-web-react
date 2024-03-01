import {
  formatDistance,
  subMonths,
  subWeeks,
  subDays,
  startOfDay,
  endOfDay,
  format as formatDate,
  isFuture
} from 'date-fns';
import humanizeDuration from 'humanize-duration';
import i18next from 'i18next';
import pluralize from 'pluralize';

import dateLocales from './locales';

export const EVENT_SYMBOL_DATE_FORMAT = 'DD MMM YY';

export const SHORT_TIME_FORMAT = 'HH:mm';
export const STANDARD_DATE_FORMAT = 'dd MMM YY HH:mm';

export const SHORTENED_DATE_FORMAT = STANDARD_DATE_FORMAT.replace(' HH:mm', '');

export const getCurrentLocale = () => dateLocales[i18next.language];

export const format = (date, format) => formatDate(date, format, {
  locale: getCurrentLocale(),
  useAdditionalWeekYearTokens: true,
  useAdditionalDayOfYearTokens: true,
});

export const dateIsValid = (date) => date instanceof Date && !isNaN(date.valueOf());

export const calcFriendlyDurationString = (from, until) => {
  const locale = getCurrentLocale();
  const t = i18next.getFixedT(null, 'utils', 'calcFriendlyDurationString');

  if (!from && !until) {
    return t('monthAgo');
  }

  if (!until){
    return t('untilNow', {
      date: formatDistance(startOfDay(from), new Date(), { locale })
    });
  }

  if (!from){
    return t('monthAgoUntilNow', {
      date: formatDistance(startOfDay(until), new Date(), { locale })
    });
  }

  const untilIsFuture = isFuture(until);
  const untilDate = untilIsFuture ? new Date(until) : startOfDay(new Date(until));

  return t(untilIsFuture ? 'someAgoFromNow' : 'someAgo', {
    from: formatDistance(startOfDay(from), new Date(), { locale }),
    until: formatDistance(untilDate, new Date(), { locale })
  });
};

export const generateDaysAgoDate = (daysAgo = 1) => new Date(startOfDay(subDays(new Date(), daysAgo)));

export const generateWeeksAgoDate = (weeksAgo = 1) => new Date(startOfDay(subWeeks(new Date(), weeksAgo)));

export const generateMonthsAgoDate = (monthsAgo = 1) => new Date(startOfDay(subMonths(new Date(), monthsAgo)));

export const endOfToday = () => endOfDay(new Date());

export const formatEventSymbolDate = (dateString) => format(
  new Date(dateString),
  EVENT_SYMBOL_DATE_FORMAT,
  { locale: getCurrentLocale() }
);

export const generateCurrentTimeZoneTitle = () => {
  const t = i18next.getFixedT(null, 'utils');

  return t('currentTimeZoneTitle', { timeZone: window.Intl.DateTimeFormat().resolvedOptions().timeZone });
};

export const getHoursAndMinutesString = (date) => {
  if (!date) {
    return '';
  }

  const dateMinutes = (new Date(date).getMinutes() < 10 ? '0' : '') + new Date(date).getMinutes();
  const dateHours = (new Date(date).getHours() < 10 ? '0' : '') + new Date(date).getHours();
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

export const durationHumanizer = (config = HUMANIZED_DURATION_CONFIGS.FULL_FORMAT()) =>
  humanizeDuration.humanizer(config);

export const getUserLocaleTime = (date = new Date()) => date.toLocaleTimeString(
  i18next.language,
  { hour: '2-digit', minute: '2-digit' }
);

export const isGreaterThan = (date1, date2) => date1.getTime() > date2.getTime();
