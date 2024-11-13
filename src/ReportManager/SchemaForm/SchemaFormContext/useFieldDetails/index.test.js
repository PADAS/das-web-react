import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import useFieldDetails from './';
import SchemaFormContextProvider from '../SchemaFormContext';

describe('ReportManager - SchemaForm - useFieldDetails', () => {

  const efb = {
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

  const contextProps = {
    schema: efb,
    onFieldChange: () => {},
    formData: {
      'this_is_a_text': 'a text value'
    },
    formErrors: {}
  };

  const wrapper = ({ children }) => (
    <SchemaFormContextProvider {...contextProps}>
      {children}
    </SchemaFormContextProvider>
  );

  const renderUseFieldDetails = (fieldName) => renderHook(() => useFieldDetails(fieldName), { wrapper });

  test('gets section details', () => {
    const { result } = renderUseFieldDetails('section-_PdgePvPWyACfu9sgN_F6');

    expect( result.current ).toEqual({
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

  test('gets field details', () => {
    const { result } = renderUseFieldDetails('this_is_a_text');

    expect( result.current ).toEqual({
      defaultInput: 'initial value',
      description: 'some good description',
      inputType: 'SHORT_TEXT',
      isActive: true,
      isRequired: true,
      label: 'This is a text',
      placeholder: 'a placeholder',
      value: 'a text value',
      error: null
    });
  });

  test('gets header details', () => {
    const { result } = renderUseFieldDetails('header-ghqdjqGinaJMptIEJBQmO');

    expect( result.current ).toEqual({
      'label': 'A great header',
      'section': 'section-_PdgePvPWyACfu9sgN_F6',
      'size': 'LARGE'
    });
  });

});
