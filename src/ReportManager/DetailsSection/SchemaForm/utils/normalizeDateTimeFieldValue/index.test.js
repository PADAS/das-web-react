import { format, parseISO } from 'date-fns';

import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

import normalizeDateTimeFieldValue from './';

const { DATE, DATE_TIME, TIME } = DATE_TIME_ELEMENT_INPUT_TYPES;

describe('ReportManager - DetailsSection - SchemaForm - utils - normalizeDateTimeFieldValue', () => {
  const fixedNow = new Date('2023-07-15T12:30:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('does not normalize the value if it is falsy', () => {
    expect(normalizeDateTimeFieldValue(undefined, DATE_TIME)).toBeUndefined();
    expect(normalizeDateTimeFieldValue(null, DATE_TIME)).toBeNull();
    expect(normalizeDateTimeFieldValue('', DATE_TIME)).toBe('');
  });

  test('normalizes the separator to be "T" for date-time values', () => {
    expect(normalizeDateTimeFieldValue('2024-06-01 14:30:45', DATE_TIME)).toBe(
      normalizeDateTimeFieldValue('2024-06-01T14:30:45', DATE_TIME),
    );
  });

  test('corrects the timezone for date-time values', () => {
    const input = '2024-03-10T08:00:00Z';
    const parsed = parseISO(input);
    const expected = format(parsed, 'yyyy-MM-dd\'T\'HH:mm:ssXXX');

    expect(normalizeDateTimeFieldValue(input, DATE_TIME)).toBe(expected);
  });

  test('does not correct the timezone for date-time values if it is not a valid date-time', () => {
    expect(normalizeDateTimeFieldValue('2024-13-T10:', DATE_TIME)).toBe('2024-13-T10:');
  });

  test('corrects the timezone for time values', () => {
    const timeValue = '09:15:30';
    const datePrefix = format(fixedNow, 'yyyy-MM-dd');
    const expected = format(
      parseISO(`${datePrefix}T${timeValue}`),
      'HH:mm:ssXXX',
    );

    expect(normalizeDateTimeFieldValue(timeValue, TIME)).toBe(expected);
  });

  test('does not correct the timezone for time values if it is not a valid time', () => {
    expect(normalizeDateTimeFieldValue('13:', TIME)).toBe('13:');
  });

  test('does not normalize the value if it is a DATE element input type', () => {
    expect(normalizeDateTimeFieldValue('2024-01-15', DATE)).toBe('2024-01-15');
  });
});
