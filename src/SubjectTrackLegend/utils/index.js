import {
  isAfter,
  isBefore,
  setHours,
  setMinutes
} from 'date-fns';

import { TIME_OF_DAY_RANGES } from '../constants';
import { getTimeInTimezone } from '../../utils/datetime';

const buildTimeOfDayRangeObjectFromRangeString = (range) => {
  const [from, to] = range.split('-');
  const [fromHour, fromMin] = from.split(':');
  const [toHour, toMin] = to.split(':');
  return {
    from: {
      hour: fromHour,
      min: fromMin
    },
    to: {
      hour: toHour,
      min: toMin
    }
  };
};

const buildDateBasedOnStringTime = (stringTime) => {
  const date = new Date();
  const [hour, min] = stringTime.split(':');
  return setHours(
    setMinutes(date, parseInt(min)),
    parseInt(hour)
  );
};

export const getTimeOfDayRangeLevelBasedOnTime = (datetimeString, timeZone) => {
  const trackPointTimeDate = buildDateBasedOnStringTime(getTimeInTimezone(new Date(datetimeString), timeZone));
  let timeOfDayRangeLevel = null;

  for (const [rangeLevel, range] of Object.entries(TIME_OF_DAY_RANGES)) {
    const { from, to } = buildTimeOfDayRangeObjectFromRangeString(range);
    const fromRangeDate = buildDateBasedOnStringTime(`${from.hour}:${from.min}`);
    const toRangeDate = buildDateBasedOnStringTime(`${to.hour}:${to.min}`);

    const after = isAfter(trackPointTimeDate, fromRangeDate);
    const before = isBefore(trackPointTimeDate, toRangeDate);

    if ( after && before ){
      timeOfDayRangeLevel = rangeLevel;
      break;
    }
  }

  return parseInt(timeOfDayRangeLevel);
};
