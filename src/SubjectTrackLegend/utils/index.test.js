import { getTimeOfDayRangeLevelBasedOnTime } from './';

import { TIME_OF_DAY_RANGE_LEVELS } from '../constants';

describe('SubjectTrackLegend - utils', () => {
  test('calculate proper time of day range based on time', () => {
    expect(
      getTimeOfDayRangeLevelBasedOnTime(
        '2025-02-21T03:00:07.940Z', // time being converted to 21:00 based on Monterrey time
        'America/Monterrey'
      )
    ).toBe(TIME_OF_DAY_RANGE_LEVELS.LEVEL_3);
  });
});