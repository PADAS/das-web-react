import { useTranslation } from 'react-i18next';

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const monthKeys = ['jan', 'feb', 'mar', 'ap', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const longDateFormats = {
  'es': 'dd/mm/yyyy',
  'en-US': 'mm/dd/yyyy',
};
const longDateTimeFormats = {
  'es': 'dd/mm/yyyy hh:mm:ss',
  'en-US': 'mm/dd/yyyy hh:mm:ss',
};

const useDatepickerLocalization = () => {
  const { t, i18n: { language } } = useTranslation('datepicker');
  const translatedDays = dayKeys.map((dayKey) => t(`days.${dayKey}`));
  const translatedMonths = monthKeys.map((dayKey) => t(`months.${dayKey}`));

  const locale = {
    localize: {
      day: n => translatedDays[n],
      month: n => translatedMonths[n]
    },
    formatLong: {
      date: () => longDateFormats[language],
      dateTime: () => longDateTimeFormats[language],
      time: () => 'hh:mm:ss',
    }
  };

  return { locale, language, t };
};

export default useDatepickerLocalization;
