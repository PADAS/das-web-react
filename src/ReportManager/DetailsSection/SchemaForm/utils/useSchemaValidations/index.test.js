import React from 'react';
import { I18nextProvider } from 'react-i18next';

import { renderHook } from '../../../../../test-utils';
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

    expect(runValidations(formData)).toEqual({
      this_is_a_text: {
        message: 'This is a required field.',
      },
    });
  });

  it('returns the date format validation error', () => {
    schema.json.properties.this_is_a_date_time = {
      deprecated: false,
      description: 'some good description',
      format: 'date',
      title: 'This is a date',
      type: 'string',
    };
    schema.ui.fields.this_is_a_date_time = {
      type: 'DATE_TIME',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_date_time',
        type: 'field',
      },
    ];
    const formData = { this_is_a_date_time: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      this_is_a_date_time: {
        message: 'Invalid date format or invalid date. Double-check the day, month and year.',
      },
    });
  });

  it('returns the date-time format validation error', () => {
    schema.json.properties.this_is_a_date_time = {
      deprecated: false,
      description: 'some good description',
      format: 'date-time',
      title: 'This is a date-time',
      type: 'string',
    };
    schema.ui.fields.this_is_a_date_time = {
      type: 'DATE_TIME',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_date_time',
        type: 'field',
      },
    ];
    const formData = { this_is_a_date_time: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      this_is_a_date_time: {
        message: 'Invalid date & time format or invalid date. Double-check the day, month and year.',
      }
    });
  });

  it('returns the time format validation error', () => {
    schema.json.properties.this_is_a_date_time = {
      deprecated: false,
      description: 'some good description',
      format: 'time',
      title: 'This is a time',
      type: 'string',
    };
    schema.ui.fields.this_is_a_date_time = {
      type: 'DATE_TIME',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_date_time',
        type: 'field',
      },
    ];
    const formData = { this_is_a_date_time: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      this_is_a_date_time: {
        message: 'Invalid time format.',
      },
    });
  });

  it('returns the max items validation error', () => {
    schema.json.properties.this_is_a_collection = {
      deprecated: false,
      items: {
        additionalProperties: false,
        properties: {},
        required: [],
        type: 'object',
      },
      maxItems: 3,
      title: 'This is a collection',
      type: 'array',
      unevaluatedItems: false,
    };
    schema.ui.fields.this_is_a_collection = {
      buttonText: 'a button text',
      columns: 1,
      itemIdentifier: '',
      leftColumn: [],
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_collection',
        type: 'field',
      },
    ];
    const formData = { this_is_a_collection: [{}, {}, {}, {}] };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      this_is_a_collection: {
        message: 'This collection must have at most 3 items.',
      },
    });
  });

  it('returns the min items validation error', () => {
    schema.json.properties.this_is_a_collection = {
      deprecated: false,
      items: {
        additionalProperties: false,
        properties: {},
        required: [],
        type: 'object',
      },
      minItems: 3,
      title: 'This is a collection',
      type: 'array',
      unevaluatedItems: false,
    };
    schema.ui.fields.this_is_a_collection = {
      buttonText: 'a button text',
      columns: 1,
      itemIdentifier: '',
      leftColumn: [],
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'this_is_a_collection',
        type: 'field',
      },
    ];
    const formData = { this_is_a_collection: [{}, {}] };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      this_is_a_collection: {
        message: 'This collection must have at least 3 items.',
      },
    });
  });

  it('injects nested errors in collection item forms', () => {
    schema.json.properties.collection_1 = {
      deprecated: false,
      items: {
        additionalProperties: false,
        properties: {
          collection_2: {
            deprecated: false,
            items: {
              additionalProperties: false,
              properties: {
                collection_3: {
                  deprecated: false,
                  items: {
                    additionalProperties: false,
                    properties: {
                      text_1: {
                        default: '',
                        deprecated: false,
                        description: '',
                        title: 'Text 1',
                        type: 'string',
                      }
                    },
                    required: ['text_1'],
                    type: 'object',
                  },
                  title: 'Collection 3',
                  type: 'array',
                  unevaluatedItems: false,
                }
              },
              required: [],
              type: 'object',
            },
            title: 'Collection 2',
            type: 'array',
            unevaluatedItems: false,
          },
        },
        required: [],
        type: 'object',
      },
      title: 'Collection 1',
      type: 'array',
      unevaluatedItems: false,
    };
    schema.ui.fields.collection_1 = {
      buttonText: '',
      columns: 1,
      itemIdentifier: '',
      leftColumn: ['collection_2'],
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.fields.collection_2 = {
      buttonText: '',
      columns: 1,
      itemIdentifier: '',
      leftColumn: ['collection_3'],
      parent: 'collection_1',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.fields.collection_3 = {
      buttonText: '',
      columns: 1,
      itemIdentifier: '',
      leftColumn: ['text_1'],
      parent: 'collection_2',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.fields.text_1 = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'collection_3',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'collection_1',
        type: 'field',
      },
    ];
    const formData = {
      collection_1: [{
        collection_2: [{
          collection_3: [{
            text_1: undefined,
          }],
        }],
      }],
    };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      collection_1: {
        0: {
          collection_2: {
            0: {
              collection_3: {
                0: {
                  text_1: {
                    message: 'This is a required field.',
                  }
                },
                message: 'Some items of this collection have errors in their inner forms.',
              }
            },
            message: 'Some items of this collection have errors in their inner forms.'
          }
        },
        message: 'Some items of this collection have errors in their inner forms.',
      }
    });
  });
});
