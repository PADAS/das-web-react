import '../../../i18nForTests';

import { format, parseISO } from 'date-fns';

import { choicesListOptions } from '../fixtures';
import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES } from '../constants';
import { epsg5367 } from '../../../__test-helpers/fixtures/location';
import { GPS_FORMATS } from '../../location';

import getHumanizedFieldValue from '.';

describe('getHumanizedFieldValue', () => {
  test('returns the default value if no value is provided', () => {
    expect(getHumanizedFieldValue({ type: FORM_ELEMENT_TYPES.TEXT }, undefined, 'default', GPS_FORMATS.DEG))
      .toBe('default');
  });

  test('returns the default value for a field explicitly emptied', () => {
    [FORM_ELEMENT_TYPES.ATTACHMENT, FORM_ELEMENT_TYPES.CHOICE_LIST, FORM_ELEMENT_TYPES.COLLECTION].forEach((type) => {
      expect(getHumanizedFieldValue({ details: { multiple: true }, type }, null, 'default', GPS_FORMATS.DEG))
        .toBe('default');
    });
  });

  test('returns the default value if the attachment array is empty', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.ATTACHMENT },
      [],
      'default',
      GPS_FORMATS.DEG
    )).toBe('default');
  });

  test('returns the count of attachments', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.ATTACHMENT },
      [{}, {}, {}],
      'default',
      GPS_FORMATS.DEG
    )).toBe('3 files');
  });

  test('returns the count of a single attachment', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.ATTACHMENT },
      [{}],
      'default',
      GPS_FORMATS.DEG
    )).toBe('1 file');
  });

  test('returns an affirmative value for a checked boolean', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.BOOLEAN },
      true,
      'default',
      GPS_FORMATS.DEG
    )).toBe('Yes');
  });

  test('returns a negative value for an unchecked boolean', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.BOOLEAN },
      false,
      'default',
      GPS_FORMATS.DEG
    )).toBe('No');
  });

  test('returns the length of a collection', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.COLLECTION },
      [{}, {}],
      'default',
      GPS_FORMATS.DEG
    )).toBe('2 items');
  });

  test('returns the choice list values separated by a comma if it supports multiple values', () => {
    expect(getHumanizedFieldValue(
      {
        details: {
          multiple: true,
          options: choicesListOptions
        },
        type: FORM_ELEMENT_TYPES.CHOICE_LIST
      },
      ['17e67b22-0e4a-4fcb-aeee-903b51a7a2e0', '223ab492-0ea7-4ff2-b8b8-cb6504c943b6'],
      'default',
      GPS_FORMATS.DEG
    )).toBe('Desert Bighorn Sheep, Ranger Cruz');
  });

  test('returns the default value for a multiple choice list emptied of every choice', () => {
    expect(getHumanizedFieldValue(
      {
        details: {
          multiple: true,
          options: choicesListOptions
        },
        type: FORM_ELEMENT_TYPES.CHOICE_LIST
      },
      [],
      'default',
      GPS_FORMATS.DEG
    )).toBe('default');
  });

  test('returns the choice list value it supports a single value', () => {
    expect(getHumanizedFieldValue(
      {
        details: {
          multiple: false,
          options: choicesListOptions
        },
        type: FORM_ELEMENT_TYPES.CHOICE_LIST
      },
      '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
      'default',
      GPS_FORMATS.DEG
    )).toBe('EarthRanger System');
  });

  test('returns a readable date value', () => {
    expect(getHumanizedFieldValue(
      { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE }, type: FORM_ELEMENT_TYPES.DATE_TIME },
      '2020-01-01',
      'default',
      GPS_FORMATS.DEG
    )).toBe('2020/01/01');
  });

  test('returns a readable date time value', () => {
    const utcValue = '2020-01-01T06:30:00Z';
    expect(getHumanizedFieldValue(
      { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME }, type: FORM_ELEMENT_TYPES.DATE_TIME },
      utcValue,
      'default',
      GPS_FORMATS.DEG
    )).toBe(format(parseISO(utcValue), 'yyyy/MM/dd hh:mm a'));
  });

  test('returns a readable time value', () => {
    const utcValue = '06:30:00Z';
    expect(getHumanizedFieldValue(
      { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME }, type: FORM_ELEMENT_TYPES.DATE_TIME },
      utcValue,
      'default',
      GPS_FORMATS.DEG
    )).toBe(format(parseISO(`2000-01-01T${utcValue}`), 'hh:mm a'));
  });

  test('returns the default value if a date-time element is invalid', () => {
    expect(getHumanizedFieldValue(
      { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE }, type: FORM_ELEMENT_TYPES.DATE_TIME },
      'invalid',
      'default',
      GPS_FORMATS.DEG
    )).toBe('default');
  });

  test('returns the coordinates from a location in the provided coordinates representation', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.LOCATION },
      { latitude: 10.1234, longitude: 30.987 },
      'default',
      GPS_FORMATS.DEG
    )).toBe('10.123400°, 30.987000°');
  });

  test('returns the default value if a location falls outsite the supported BBOX of the coordinates representation', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.LOCATION },
      { latitude: 10.1234, longitude: 30.987 },
      'default',
      epsg5367
    )).toBe('default');
  });

  test('returns the plain value for other element types', () => {
    expect(getHumanizedFieldValue(
      { type: FORM_ELEMENT_TYPES.TEXT },
      'Value',
      'default',
      GPS_FORMATS.DEG
    )).toBe('Value');
  });
});
