import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { renderHook } from '@testing-library/react-hooks';

import i18n from '../../../../../i18nForTests';

import useSchemaValidations from '.';

describe('ReportManager - DetailsSection - SchemaForm - Utils - useSchemaValidations', () => {
  let schema;
  beforeEach(() => {
    schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {},
        required: [],
        type: 'object',
      },
      ui: {
        fields: {},
        headers: {},
        order: ['section-_PdgePvPWyACfu9sgN_F6'],
        sections: {
          'section-_PdgePvPWyACfu9sgN_F6': {
            columns: 1,
            isActive: true,
            label: '',
            leftColumn: [],
            rightColumn: [],
          },
        },
      },
    };
  });

  const Wrapper = ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;

  it('returns no errors if the form data is ok', () => {
    schema.json.properties.this_is_a_text = {
      default: 'initial value',
      deprecated: false,
      description: 'some good description',
      title: 'This is a text',
      type: 'string',
    };
    schema.json.required = ['this_is_a_text'];
    schema.ui.fields.this_is_a_text = {
      inputType: 'SHORT_TEXT',
      placeholder: 'a placeholder',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_text',
        type: 'field',
      },
    ];
    const formData = { this_is_a_text: 'Valid text value' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toBeNull();
  });

  it('returns the required validation error', () => {
    schema.json.properties.this_is_a_text = {
      default: 'initial value',
      deprecated: false,
      description: 'some good description',
      title: 'This is a text',
      type: 'string',
    };
    schema.json.required = ['this_is_a_text'];
    schema.ui.fields.this_is_a_text = {
      inputType: 'SHORT_TEXT',
      placeholder: 'a placeholder',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_text',
        type: 'field',
      },
    ];
    const formData = { this_is_a_text: undefined };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({ this_is_a_text: 'This is a required field.' });
  });
});
