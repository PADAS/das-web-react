import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformNumericField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformNumericField', () => {
  const numericFieldId = 'number-of-snares';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [numericFieldId]: {
        details: {
          isRequired: true,
          label: 'Number of snares',
          value: numericFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    };
    jsonSchema = {
      properties: {
        [numericFieldId]: {
          default: 1,
          description: 'Total amount of snares',
          maximum: 50,
          minimum: 1,
        },
      },
    };
    uiSchema = {
      fields: {
        [numericFieldId]: {
          placeholder: '1',
        },
      },
    };
  });

  it('transforms a numeric field', () => {
    transformNumericField(numericFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [numericFieldId]: {
        details: {
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '1',
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with missing properties', () => {
    delete jsonSchema.properties[numericFieldId].default;
    delete jsonSchema.properties[numericFieldId].description;
    delete jsonSchema.properties[numericFieldId].maximum;
    delete jsonSchema.properties[numericFieldId].minimum;
    delete uiSchema.fields[numericFieldId].placeholder;

    transformNumericField(numericFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [numericFieldId]: {
        details: {
          defaultInput: null,
          description: '',
          hint: '',
          isRequired: true,
          label: 'Number of snares',
          maxInput: null,
          minInput: null,
          value: numericFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });
});
