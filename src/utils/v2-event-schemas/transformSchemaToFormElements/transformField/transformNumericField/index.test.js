
import transformNumericField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformNumericField', () => {
  const numericFieldId = 'number-of-snares';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [numericFieldId]: {
        details: {
          isRequired: true,
          label: 'Number of snares',
          value: numericFieldId,
        },
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
      },
    });
  });

  it('transforms a numeric field with no description', () => {
    jsonSchema.properties[numericFieldId].description = '';

    transformNumericField(numericFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [numericFieldId]: {
        details: {
          defaultInput: 1,
          description: '',
          hint: '1',
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
      },
    });
  });

  it('transforms a numeric field with no hint', () => {
    uiSchema.fields[numericFieldId].placeholder = '';

    transformNumericField(numericFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [numericFieldId]: {
        details: {
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '',
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
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
      },
    });
  });
});
