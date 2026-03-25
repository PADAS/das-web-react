import React from 'react';
import { I18nextProvider } from 'react-i18next';

import { renderHook } from '../../../../../test-utils';
import i18n from '../../../../../i18nForTests';
import { TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN } from '../../../../../utils/v2-event-schemas/constants';

import useSchemaValidations from '.';

describe('ReportManager - DetailsSection - SchemaForm - Utils - useSchemaValidations', () => {
  let schema;
  beforeEach(() => {
    schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        properties: {},
        required: [],
        type: 'object',
        unevaluatedProperties: false,
      },
      ui: {
        fields: {},
        headers: {},
        order: ['section-_PdgePvPWyACfu9sgN_F6'],
        sections: {
          'section-_PdgePvPWyACfu9sgN_F6': {
            columns: 1,
            conditions: [],
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
    schema.json.properties.text = {
      default: '',
      deprecated: false,
      description: '',
      title: 'Text field',
      type: 'string',
    };
    schema.json.required = ['text'];
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'Valid text value' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toBeNull();
  });

  it('returns the email format validation error', () => {
    schema.json.properties.text = {
      deprecated: false,
      description: '',
      format: 'email',
      title: 'Text field (email format)',
      type: 'string',
    };
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'Invalid email format.',
      },
    });
  });

  it('returns the date format validation error', () => {
    schema.json.properties.dateTime = {
      deprecated: false,
      description: '',
      format: 'date',
      title: 'Date-time field (date format)',
      type: 'string',
    };
    schema.ui.fields.dateTime = {
      type: 'DATE_TIME',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'dateTime',
        type: 'field',
      },
    ];
    const formData = { dateTime: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      dateTime: {
        message: 'Invalid date format or invalid date. Double-check the day, month and year.',
      },
    });
  });

  it('returns the date-time format validation error', () => {
    schema.json.properties.dateTime = {
      deprecated: false,
      description: '',
      format: 'date-time',
      title: 'Date-time field (date-time format)',
      type: 'string',
    };
    schema.ui.fields.dateTime = {
      type: 'DATE_TIME',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'dateTime',
        type: 'field',
      },
    ];
    const formData = { dateTime: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      dateTime: {
        message: 'Invalid date & time format or invalid date. Double-check the day, month and year.',
      }
    });
  });

  it('returns the time format validation error', () => {
    schema.json.properties.dateTime = {
      deprecated: false,
      description: '',
      format: 'time',
      title: 'Date-time field (time format)',
      type: 'string',
    };
    schema.ui.fields.dateTime = {
      type: 'DATE_TIME',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'dateTime',
        type: 'field',
      },
    ];
    const formData = { dateTime: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      dateTime: {
        message: 'Invalid time format.',
      },
    });
  });

  it('returns the uri format validation error', () => {
    schema.json.properties.text = {
      deprecated: false,
      description: '',
      format: 'uri',
      title: 'Text field (uri format)',
      type: 'string',
    };
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'Invalid URL format.',
      },
    });
  });

  it('returns the uuid format validation error', () => {
    schema.json.properties.text = {
      deprecated: false,
      description: '',
      format: 'uuid',
      title: 'Text field (uuid format)',
      type: 'string',
    };
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'Invalid UUID format.',
      },
    });
  });

  it('returns the default format validation error', () => {
    schema.json.properties.text = {
      deprecated: false,
      description: '',
      format: 'uri-reference',
      title: 'Text field (invalid format)',
      type: 'string',
    };
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'invalid uri-reference' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'Invalid format.',
      },
    });
  });

  it('returns the maximum validation error', () => {
    schema.json.properties.number = {
      deprecated: false,
      description: '',
      maximum: 10,
      title: 'Number field',
      type: 'number',
    };
    schema.ui.fields.number = {
      type: 'NUMERIC',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'number',
        type: 'field',
      },
    ];
    const formData = { number: 11 };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      number: {
        message: 'This value should be less than or equal to 10.',
      },
    });
  });

  it('returns the max items validation error', () => {
    schema.json.properties.collection = {
      deprecated: false,
      items: {
        properties: {},
        required: [],
        type: 'object',
        unevaluatedProperties: false,
      },
      maxItems: 3,
      title: 'Collection field',
      type: 'array',
      unevaluatedItems: false,
    };
    schema.ui.fields.collection = {
      buttonText: '',
      columns: 1,
      itemIdentifier: '',
      leftColumn: [],
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'collection',
        type: 'field',
      },
    ];
    const formData = { collection: [{}, {}, {}, {}] };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      collection: {
        message: 'This collection must have at most 3 items.',
      },
    });
  });

  it('returns the minimum validation error', () => {
    schema.json.properties.number = {
      deprecated: false,
      description: '',
      minimum: 5,
      title: 'Number field',
      type: 'number',
    };
    schema.ui.fields.number = {
      type: 'NUMERIC',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'number',
        type: 'field',
      },
    ];
    const formData = { number: 2 };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      number: {
        message: 'This value should be greater than or equal to 5.',
      },
    });
  });

  it('returns the min items validation error', () => {
    schema.json.properties.collection = {
      deprecated: false,
      items: {
        properties: {},
        required: [],
        type: 'object',
        unevaluatedProperties: false,
      },
      minItems: 3,
      title: 'Collection field',
      type: 'array',
      unevaluatedItems: false,
    };
    schema.ui.fields.collection = {
      buttonText: '',
      columns: 1,
      itemIdentifier: '',
      leftColumn: [],
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
      rightColumn: [],
      type: 'COLLECTION',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'collection',
        type: 'field',
      },
    ];
    const formData = { collection: [{}, {}] };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      collection: {
        message: 'This collection must have at least 3 items.',
      },
    });
  });

  it('returns the alphanumeric pattern validation error', () => {
    schema.json.properties.text = {
      deprecated: false,
      description: '',
      pattern: TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN,
      title: 'Text field (alphanumeric format)',
      type: 'string',
    };
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'invalid $' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'Only letters and numbers are allowed.',
      },
    });
  });

  it('returns the default pattern validation error', () => {
    schema.json.properties.text = {
      deprecated: false,
      description: '',
      pattern: '^custom-.+$',
      title: 'Text field (invalid pattern)',
      type: 'string',
    };
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: 'invalid' };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'Invalid pattern.',
      },
    });
  });

  it('returns the required validation error', () => {
    schema.json.properties.text = {
      default: '',
      deprecated: false,
      description: '',
      title: 'Text field',
      type: 'string',
    };
    schema.json.required = ['text'];
    schema.ui.fields.text = {
      inputType: 'SHORT_TEXT',
      placeholder: '',
      type: 'TEXT',
      parent: 'section-_PdgePvPWyACfu9sgN_F6',
    };
    schema.ui.sections['section-_PdgePvPWyACfu9sgN_F6'].leftColumn = [
      {
        name: 'text',
        type: 'field',
      },
    ];
    const formData = { text: undefined };

    const { result } = renderHook(() => useSchemaValidations(schema), { wrapper: Wrapper });

    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      text: {
        message: 'This is a required field.',
      },
    });
  });

  it('injects nested errors in collection item forms', () => {
    schema.json.properties.collection_1 = {
      deprecated: false,
      items: {
        properties: {
          collection_2: {
            deprecated: false,
            items: {
              properties: {
                collection_3: {
                  deprecated: false,
                  items: {
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
                    unevaluatedProperties: false,
                  },
                  title: 'Collection 3',
                  type: 'array',
                  unevaluatedItems: false,
                }
              },
              required: [],
              type: 'object',
              unevaluatedProperties: false,
            },
            title: 'Collection 2',
            type: 'array',
            unevaluatedItems: false,
          },
        },
        required: [],
        type: 'object',
        unevaluatedProperties: false,
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
