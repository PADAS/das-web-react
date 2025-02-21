import {
  isAfter,
  isBefore,
  setHours,
  setMinutes
} from 'date-fns';

import { TIME_OF_DAY_RANGES } from './constants';
import { getTimeInTimezone } from '../utils/datetime';

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

export const getTimeOfDayRangeLevelBasedOnTime = (time, timeZone = 'America/Tijuana') => {
  const trackPointTimeDate = buildDateBasedOnStringTime(getTimeInTimezone(new Date(time), timeZone));
  let timeOfDayRangeLevel = null;

  for (const [rangeLevel, range] of Object.entries(TIME_OF_DAY_RANGES)) {
    const { from, to } = buildTimeOfDayRangeObjectFromRangeString(range);
    const fromRangeDate = buildDateBasedOnStringTime(`${from.hour}:${from.min}`);
    const toRangeDate = buildDateBasedOnStringTime(`${to.hour}:${to.min}`);

    if ( isAfter(trackPointTimeDate, fromRangeDate) && isBefore(trackPointTimeDate, toRangeDate) ){
      timeOfDayRangeLevel = rangeLevel;
      break;
    }
  }

  return timeOfDayRangeLevel;
};
