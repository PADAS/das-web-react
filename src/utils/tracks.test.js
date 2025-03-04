import { getTimeOfDayPeriodBasedOnTime } from './tracks';

describe('utils - tracks', () => {

  const baseDateTimeString = '2025-02-21T21:41:14.677Z';

  test('calculate proper time of day range based on time', () => {
    expect(
      // time being converted to 15:41 based on Monterrey time, having 941 minutes therefore falling into period #1
      getTimeOfDayPeriodBasedOnTime(
        baseDateTimeString,
        'America/Monterrey'
      )
    ).toBe(1);
  });

  test.only('calculate proper time of day range based on time', () => {
    expect(
      // time being converted to 05:41 based on Hong Kong time, having 341 minutes therefore falling into period #1
      getTimeOfDayPeriodBasedOnTime(
        baseDateTimeString,
        'Asia/Hong_Kong'
      )
    ).toBe(5);
  });

});