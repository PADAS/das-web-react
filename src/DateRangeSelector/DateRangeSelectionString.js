import React from 'react';
import { useTranslation } from 'react-i18next';

import { calcFriendlyDurationString } from '../utils/datetime';
import { DATE_LOCALES } from '../constants';

const DateRangeSelectionString = ({
  startDate,
  endDate,
  className = ''
}) => {
  const { t, i18n: { language } } = useTranslation('filters', { keyPrefix: 'friendlyDurationString' });
  return <span className={className}>
    <strong>{calcFriendlyDurationString(startDate, endDate, t, DATE_LOCALES[language])}</strong>
  </span>;
};

export default DateRangeSelectionString;