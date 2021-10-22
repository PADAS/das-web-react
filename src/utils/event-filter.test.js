import { calcSortParamForEventFilter, sortEventsBySortConfig, SORT_DIRECTION } from './event-filter';
import { events } from '../__test-helpers/fixtures/events';

test('calcSortParamForEventFilter', () => {
  const sortConfigPositive = [SORT_DIRECTION.up, { label: 'Sort option', value: 'neato' }];
  const sortConfigNegative = [SORT_DIRECTION.down, { label: 'Sort option', value: 'mosquito' }];

  expect(calcSortParamForEventFilter(sortConfigPositive)).toEqual('neato');
  expect(calcSortParamForEventFilter(sortConfigNegative)).toEqual('-mosquito');

});

describe('sortEventsBySortConfig', () => {
  test('sorting by event.time', () => {
    const testEvents = [{ ...events[0] }, { ...events[1] }, { ...events[2] }];
    const testSortConfig = [SORT_DIRECTION.up, {
      label: 'Report Date',
      value: 'event_time',
    }];

    testEvents[0].time = '2021-08-08T23:05:57.732Z';
    testEvents[1].time = '2021-08-01T23:05:57.732Z';
    testEvents[2].time = '2021-07-29T23:05:57.732Z';

    const results = sortEventsBySortConfig(testEvents, testSortConfig);

    expect(results[0].time).toBe('2021-07-29T23:05:57.732Z');
    expect(results[2].time).toBe('2021-08-08T23:05:57.732Z');
  });
  test('sorting by event.created_at', () => {
    const testEvents = [{ ...events[0] }, { ...events[1] }, { ...events[2] }];
    const testSortConfig = [SORT_DIRECTION.up, {
      label: 'Report Date',
      value: 'event_time',
    }];

    testEvents[0].time = '2021-08-08T23:05:57.732Z';
    testEvents[1].time = '2021-08-01T23:05:57.732Z';
    testEvents[2].time = '2021-07-29T23:05:57.732Z';

    const results = sortEventsBySortConfig(testEvents, testSortConfig);

    expect(results[0].time).toBe('2021-07-29T23:05:57.732Z');
    expect(results[2].time).toBe('2021-08-08T23:05:57.732Z');

    const results2 = sortEventsBySortConfig(results, [SORT_DIRECTION.down, {
      label: 'Report Date',
      value: 'event_time',
    }]);

    expect(results2[0].time).toBe('2021-08-08T23:05:57.732Z');
    expect(results2[2].time).toBe('2021-07-29T23:05:57.732Z');


  });
  test('sorting by event.updated_at', () => {
    const testEvents = [{ ...events[0] }, { ...events[1] }, { ...events[2] }];
    const testSortConfig = [SORT_DIRECTION.up, {
      label: 'Updated',
      value: 'updated_at',
    }];

    testEvents[0].updated_at = '2021-08-08T23:05:57.732Z';
    testEvents[1].updated_at = '2021-08-01T23:05:57.732Z';
    testEvents[2].updated_at = '2021-07-29T23:05:57.732Z';

    const results = sortEventsBySortConfig(testEvents, testSortConfig);

    expect(results[0].updated_at).toBe('2021-07-29T23:05:57.732Z');
    expect(results[2].updated_at).toBe('2021-08-08T23:05:57.732Z');

    const results2 = sortEventsBySortConfig(results, [SORT_DIRECTION.down, {
      label: 'Updated',
      value: 'updated_at',
    }]);

    expect(results2[0].updated_at).toBe('2021-08-08T23:05:57.732Z');
    expect(results2[2].updated_at).toBe('2021-07-29T23:05:57.732Z');
  });
  test('sorting by event.created_at', () => {
    const testEvents = [{ ...events[0] }, { ...events[1] }, { ...events[2] }];
    const testSortConfig = [SORT_DIRECTION.up, {
      label: 'Created',
      value: 'created_at',
    }];

    testEvents[0].created_at = '2021-08-08T23:05:57.732Z';
    testEvents[1].created_at = '2021-08-01T23:05:57.732Z';
    testEvents[2].created_at = '2021-07-29T23:05:57.732Z';

    const results = sortEventsBySortConfig(testEvents, testSortConfig);

    expect(results[0].created_at).toBe('2021-07-29T23:05:57.732Z');
    expect(results[2].created_at).toBe('2021-08-08T23:05:57.732Z');

    const results2 = sortEventsBySortConfig(results, [SORT_DIRECTION.down, {
      label: 'Created',
      value: 'created_at',
    }]);

    expect(results2[0].created_at).toBe('2021-08-08T23:05:57.732Z');
    expect(results2[2].created_at).toBe('2021-07-29T23:05:57.732Z');
  });
});