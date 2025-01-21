const MILLISECONDS_IN_AN_HOUR = 60000;

export const EMPTY_TIME_VALUE = ':';

export const AM_PERIOD = 'AM';
export const PM_PERIOD = 'PM';

export const transform12To24HourFormat = (hourIn12Format, period) => {
  if (!hourIn12Format) {
    return '';
  }

  if (hourIn12Format.length === 1) {
    return hourIn12Format;
  }

  let hourIn24Format = hourIn12Format;
  if (period === PM_PERIOD && hourIn12Format !== '12') {
    hourIn24Format = (Number(hourIn12Format) + 12).toString();
  } else if (period === AM_PERIOD && hourIn12Format === '12') {
    hourIn24Format = '00';
  }
  return hourIn24Format;
};

export const transform24To12HourFormat = (hourIn24Format) => {
  if (!hourIn24Format) {
    return ['', null];
  }

  if (hourIn24Format.length === 1) {
    return [hourIn24Format, null];
  }

  const numericHourIn24Format = Number(hourIn24Format);
  const hourIn12Format = (numericHourIn24Format % 12 || 12).toString().padStart(2, '0');
  const period = numericHourIn24Format < 12 ? AM_PERIOD : PM_PERIOD;

  return [hourIn12Format, period];
};

export const getInternationalizedTimePeriods = (locale) => {
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12' });

  const midnight = new Date();
  midnight.setHours(0, 0, 0);
  const amPeriod = dateTimeFormatter
    .formatToParts(midnight)
    .find((part) => part.type === 'dayPeriod')?.value;

  const middaay = new Date();
  middaay.setHours(12, 0, 0);
  const pmPeriod = dateTimeFormatter
    .formatToParts(middaay)
    .find((part) => part.type === 'dayPeriod')?.value;

  return { [AM_PERIOD]: amPeriod || AM_PERIOD, [PM_PERIOD]: pmPeriod || PM_PERIOD };
};

export const get12HourFormatTimeWithinValidRange = (hour, minute, period, max, min) => {
  let hourWithinValidRange = hour;
  let minuteWithinValidRange = minute;
  let periodWithinValidRange = period;

  if (isHourInputComplete(hour, true) && isMinuteInputComplete(minute)) {
    const hourIn24Format = transform12To24HourFormat(hour, period);
    let hourIn24FormatWithinValidRange = hourIn24Format;

    const timeIn24Format = `${hourIn24FormatWithinValidRange}:${minute}`;
    if (max && timeIn24Format > max) {
      [hourIn24FormatWithinValidRange = '', minuteWithinValidRange = ''] = max.split(':');
    } else if (min && timeIn24Format < min) {
      [hourIn24FormatWithinValidRange = '', minuteWithinValidRange = ''] = min.split(':');
    }

    [hourWithinValidRange, periodWithinValidRange] = transform24To12HourFormat(hourIn24FormatWithinValidRange);
  }

  return [hourWithinValidRange, minuteWithinValidRange, periodWithinValidRange];
};

export const getHourWithinValidRange = (hour, max, min) => {
  if (isHourInputComplete(hour, false)) {
    const [maxHour = ''] = max.split(':');
    const [minHour = ''] = min.split(':');
    if (maxHour && hour > maxHour) {
      return maxHour;
    } else if (minHour && hour < minHour) {
      return minHour;
    }
  }
  return hour;
};

export const getMinuteWithinValidRange = (minute, hour, max, min) => {
  if (isMinuteInputComplete(minute)) {
    const [maxHour = '', maxMinute = ''] = max.split(':');
    const [minHour = '', minMinute = ''] = min.split(':');
    if (maxMinute && hour === maxHour && minute > maxMinute) {
      return maxMinute;
    } else if (minMinute && hour === minHour && minute < minMinute) {
      return minMinute;
    }
  }
  return minute;
};

export const getMinutesDifference = (startDate, endDate) => Math.round(
  Math.abs(endDate.getTime() - startDate.getTime()) / MILLISECONDS_IN_AN_HOUR
);

export const isSecondHourDigitPossible = (hour, is12HourFormat) => is12HourFormat
  ? !/^[2-9]$/.test(hour)
  : !/^[3-9]$/.test(hour);

export const isValidHourInput = (hour, is12HourFormat) => is12HourFormat
  ? /^(0|0?[1-9]|1[0-2])$/.test(hour)
  : /^([01]?[0-9]|2[0-3])$/.test(hour);

export const shouldCompleteFirstHourDigitWithZero = (hour, is12HourFormat) => is12HourFormat
  ? /^[0-1]$/.test(hour)
  : /^[0-2]$/.test(hour);

export const isHourInputComplete = (hour, is12HourFormat) => is12HourFormat
  ? /^(0[0-9]|1[0-2])$/.test(hour)
  : /^([01][0-9]|2[0-3])$/.test(hour);

export const isSecondMinuteDigitPossible = (minute) => !/^[6-9]$/.test(minute);

export const isValidMinuteInput = (minute) => /^[0-5]?[0-9]$/.test(minute);

export const shouldCompleteFirstMinuteDigitWithZero = (minute) => /^[0-5]$/.test(minute);

export const isMinuteInputComplete = (minute) => /^[0-5][0-9]$/.test(minute);

export const isValidTime = (time) => /^([01][0-9]|2[0-3]):([0-5][0-9])$/.test(time);
