import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { durationHumanizer, generateCurrentTimeZoneTitle, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;

const TimeAgo = ({ className, date, prefix = null, suffix = null }) => {
  const { t, i18n: { language } } = useTranslation('dates');

  const [timeDistance, setTimeDistance] = useState(new Date() - new Date(date));

  const olderThanAMinute = timeDistance > ONE_MINUTE;
  const olderThanAnHour = timeDistance > ONE_HOUR;

  const durationStringGenerator = useMemo(() => {
    if (olderThanAnHour){
      const abbreviations = {
        y: () => t('timeUnitAbbreviations.year'),
        mo: () => t('timeUnitAbbreviations.month'),
        w: () => t('timeUnitAbbreviations.week'),
        d: () => t('timeUnitAbbreviations.day'),
        h: () => t('timeUnitAbbreviations.hour'),
        m: () => t('timeUnitAbbreviations.minute'),
      };

      return durationHumanizer(HUMANIZED_DURATION_CONFIGS.LONG_TERM_ABRREVIATED(abbreviations));
    }

    if (olderThanAMinute) {
      return durationHumanizer(HUMANIZED_DURATION_CONFIGS.MINUTES_ONLY(t('minutesLabel')));
    }

    const notSupportedLangKeys = {
      'en-US': 'en'
    };
    return durationHumanizer(HUMANIZED_DURATION_CONFIGS.FULL_FORMAT(notSupportedLangKeys[language] ?? language));
  }, [olderThanAMinute, olderThanAnHour, t, language]);

  useEffect(() => {
    const updateFn = () => setTimeDistance(new Date() - new Date(date));

    updateFn();

    const updateInterval = window.setInterval(updateFn, olderThanAMinute ? ONE_MINUTE : ONE_SECOND);

    return () => window.clearInterval(updateInterval);
  }, [date, olderThanAMinute]);

  const elapsedTimeText = `${prefix ? `${prefix} ` : ''}${durationStringGenerator(timeDistance)}${suffix ? ` ${suffix}` : ''}`;
  const timeZoneTitle = generateCurrentTimeZoneTitle();

  return <time
    aria-label={`${elapsedTimeText}, ${timeZoneTitle}`}
    className={className}
    data-testid="time-ago"
    dateTime={new Date(date).toISOString()}
    title={timeZoneTitle}
    >
    {elapsedTimeText}
  </time>;
};

export default TimeAgo;
