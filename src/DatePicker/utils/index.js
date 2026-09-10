import { isValid, parseISO } from 'date-fns';

export const EMPTY_DATE_VALUE = '--';

export const getYearWithinValidRange = (year, max, min) => {
  if (isYearInputComplete(year)) {
    const [maxYear = ''] = max.split('-');
    const [minYear = ''] = min.split('-');
    if (maxYear && year > maxYear) {
      return maxYear;
    } else if (minYear && year < minYear) {
      return minYear;
    }
  }
  return year;
};

export const getMonthWithinValidRange = (month, year, max, min) => {
  if (isMonthInputComplete(month)) {
    const [maxYear = '', maxMonth = ''] = max.split('-');
    const [minYear = '', minMonth = ''] = min.split('-');
    if (maxMonth && year === maxYear && month > maxMonth) {
      return maxMonth;
    } else if (minMonth && year === minYear && month < minMonth) {
      return minMonth;
    }
  }
  return month;
};

export const getDayWithinValidRange = (day, month, year, max, min) => {
  if (isDayInputComplete(day)) {
    const [maxYear = '', maxMonth = '', maxDay = ''] = max.split('-');
    const [minYear = '', minMonth = '', minDay = ''] = min.split('-');
    if (maxDay && year === maxYear && month === maxMonth && day > maxDay) {
      return maxDay;
    } else if (minDay && year === minYear && month === minMonth && day < minDay) {
      return minDay;
    }
  }
  return day;
};

export const isValidYearInput = (year) => /^[0-9]{1,4}$/.test(year);

export const isYearInputComplete = (year) => /^[0-9]{4}$/.test(year);

export const isSecondMonthDigitPossible = (month) => !/^[2-9]$/.test(month);

export const isValidMonthInput = (month) => /^(0[1-9]|1[0-2]|[0-9])$/.test(month);

export const shouldCompleteFirstMonthDigitWithZero = (month) => /^1$/.test(month);

export const isMonthInputComplete = (month) => /^(0[1-9]|1[0-2])$/.test(month);

export const isSecondDayDigitPossible = (day) => !/^[4-9]$/.test(day);

export const isValidDayInput = (day) => /^(0[1-9]|[12][0-9]|3[01]|[0-9])$/.test(day);

export const shouldCompleteFirstDayDigitWithZero = (day) => /^[1-3]$/.test(day);

export const isDayInputComplete = (day) => /^(0[1-9]|[12][0-9]|3[01])$/.test(day);

export const isValidDate = (date) => /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(date)
  && isValid(parseISO(date));
