import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformNumericField from '.';

describe('Utils - form-schemas - transformSchemaToFormElements - transformField - transformNumericField', () => {
  const numericFieldName = 'number-of-snares';
  let formElements, jsonSchema, numericFieldId, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    numericFieldId = numericFieldName;
    formElements = {
      [numericFieldId]: {
        details: {
          isRequired: true,
          label: 'Number of snares',
          value: numericFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    };
    jsonSchema = {
      properties: {
        [numericFieldName]: {
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
    transformNumericField(
      numericFieldId,
      numericFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

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
          value: numericFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field stored by name in uiSchema.fields', () => {
    parentId = 'collection-1.collection-2';
    numericFieldId = `${parentId}.${numericFieldName}`;

    formElements = {
      [numericFieldId]: {
        details: {
          isRequired: true,
          label: 'Number of snares',
          value: numericFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    };
    uiSchema = {
      fields: {
        [numericFieldName]: {
          placeholder: '1',
        },
      },
    };

    transformNumericField(
      numericFieldId,
      numericFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

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
          value: numericFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with missing properties', () => {
    delete jsonSchema.properties[numericFieldName].default;
    delete jsonSchema.properties[numericFieldName].description;
    delete jsonSchema.properties[numericFieldName].maximum;
    delete jsonSchema.properties[numericFieldName].minimum;
    delete uiSchema.fields[numericFieldId].placeholder;

    transformNumericField(
      numericFieldId,
      numericFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

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
          value: numericFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });
});
