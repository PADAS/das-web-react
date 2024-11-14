import {
  getFieldUIType, getFormFieldComponent,
  getHeaderDetails,
  getSectionDetails,
  isField,
  isFieldActive,
  isFieldRequired,
  isSection
} from './';

import { FORM_FIELDS_TYPES } from '../constants';

import Text from '../fields/Text';

describe('ReportManager - SchemaForm - utils', () => {

  const schema = {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'this_is_a_text': {
          'default': 'initial value',
          'deprecated': false,
          'description': 'some good description',
          'title': 'This is a text',
          'type': 'string'
        }
      },
      'required': [
        'this_is_a_text'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'this_is_a_text': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'a placeholder',
          'type': 'TEXT',
          'parent': 'section-_PdgePvPWyACfu9sgN_F6'
        }
      },
      'headers': {
        'header-ghqdjqGinaJMptIEJBQmO': {
          'label': 'A great header',
          'section': 'section-_PdgePvPWyACfu9sgN_F6',
          'size': 'LARGE'
        }
      },
      'order': [
        'section-_PdgePvPWyACfu9sgN_F6'
      ],
      'sections': {
        'section-_PdgePvPWyACfu9sgN_F6': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-ghqdjqGinaJMptIEJBQmO',
              'type': 'header'
            },
            {
              'name': 'this_is_a_text',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  };

  test('gets section details', async () => {
    expect( getSectionDetails('section-_PdgePvPWyACfu9sgN_F6', schema) ).toEqual({
      'columns': 1,
      'isActive': true,
      'label': '',
      'leftColumn': [
        {
          'name': 'header-ghqdjqGinaJMptIEJBQmO',
          'type': 'header'
        },
        {
          'name': 'this_is_a_text',
          'type': 'field'
        }
      ],
      'rightColumn': []
    });
  });

  test('gets header details', async () => {
    expect( getHeaderDetails('header-ghqdjqGinaJMptIEJBQmO', schema) ).toEqual({
      'label': 'A great header',
      'section': 'section-_PdgePvPWyACfu9sgN_F6',
      'size': 'LARGE'
    });
  });

  test('gets field UI type of text field', async () => {
    expect( getFieldUIType('this_is_a_text', schema) ).toEqual(FORM_FIELDS_TYPES.TEXT);
  });

  test('checks if an item is a section', async () => {
    expect( isSection('this_is_a_text', schema) ).toBe(false);
    expect( isSection('section-_PdgePvPWyACfu9sgN_F6', schema) ).toBe(true);
  });

  test('checks if an item is a field', async () => {
    expect( isField('section-_PdgePvPWyACfu9sgN_F6', schema) ).toBe(false);
    expect( isField('this_is_a_text', schema) ).toBe(true);
  });

  test('checks if a field is required', async () => {
    expect( isFieldRequired('this_is_a_text', schema) ).toBe(true);
  });

  test('checks if a field is active', async () => {
    expect( isFieldActive('this_is_a_text', schema) ).toBe(true);
  });

  test('get text field component equivalent for text type ', async () => {
    expect( getFormFieldComponent('this_is_a_text', schema) ).toBe(Text);
  });

});
