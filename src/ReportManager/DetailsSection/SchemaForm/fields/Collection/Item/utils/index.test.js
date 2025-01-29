import { format, parseISO } from 'date-fns';

import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES } from '../../../../constants';

import { getHumanizedValue } from './';

import { choicesListOptions } from '../../../../fixtures';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - Item - utils', () => {
  describe('getHumanizedValue', () => {
    const t = (_, { collectionLength }) => `${collectionLength} items`;

    test('returns the default value if no value is provided', () => {
      expect(getHumanizedValue({ type: FORM_ELEMENT_TYPES.TEXT }, undefined, 'default', 'en-US', t)).toBe('default');
    });

    test('returns the length of a collection', () => {
      expect(getHumanizedValue(
        { type: FORM_ELEMENT_TYPES.COLLECTION },
        [{}, {}],
        'default',
        'en-US',
        t
      )).toBe('2 items');
    });

    test('returns the choice list values separated by a comma if it supports multiple values', () => {
      expect(getHumanizedValue(
        {
          details: {
            multiple: true,
            options: choicesListOptions
          },
          type: FORM_ELEMENT_TYPES.CHOICE_LIST
        },
        ['17e67b22-0e4a-4fcb-aeee-903b51a7a2e0', '223ab492-0ea7-4ff2-b8b8-cb6504c943b6'],
        'default',
        'en-US',
        t
      )).toBe('Desert Bighorn Sheep, Ranger Cruz');
    });

    test('returns the choice list value it supports a single value', () => {
      expect(getHumanizedValue(
        {
          details: {
            multiple: false,
            options: choicesListOptions
          },
          type: FORM_ELEMENT_TYPES.CHOICE_LIST
        },
        '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
        'default',
        'en-US',
        t
      )).toBe('EarthRanger System');
    });

    test('returns a readable date value', () => {
      expect(getHumanizedValue(
        { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE }, type: FORM_ELEMENT_TYPES.DATE_TIME },
        '2020-01-01',
        'default',
        'en-US',
        t
      )).toBe('2020/01/01');
    });

    test('returns a readable date time value', () => {
      const utcValue = '2020-01-01T06:30:00Z';
      expect(getHumanizedValue(
        { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME }, type: FORM_ELEMENT_TYPES.DATE_TIME },
        utcValue,
        'default',
        'en-US',
        t
      )).toBe(format(parseISO(utcValue), 'yyyy/MM/dd hh:mm a'));
    });

    test('returns a readable time value', () => {
      const utcValue = '06:30:00Z';
      expect(getHumanizedValue(
        { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME }, type: FORM_ELEMENT_TYPES.DATE_TIME },
        utcValue,
        'default',
        'en-US',
        t
      )).toBe(format(parseISO(`2000-01-01T${utcValue}`), 'hh:mm a'));
    });

    test('returns the default value if a date-time element is invalid', () => {
      expect(getHumanizedValue(
        { details: { inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE }, type: FORM_ELEMENT_TYPES.DATE_TIME },
        'invalid',
        'default',
        'en-US',
        t
      )).toBe('default');
    });

    test('returns the coordinates from a location', () => {
      expect(getHumanizedValue(
        { type: FORM_ELEMENT_TYPES.LOCATION },
        { latitude: 10.1234, longitude: 30.987 },
        'default',
        'en-US',
        t
      )).toBe('10.1234°, 30.987°');
    });

    test('returns the plain value for other element types', () => {
      expect(getHumanizedValue(
        { type: FORM_ELEMENT_TYPES.TEXT },
        'Value',
        'default',
        'en-US',
        t
      )).toBe('Value');
    });
  });
});
