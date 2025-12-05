import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformNumericField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformNumericField', () => {
  const numericFieldId = 'number-of-snares';
  const parentId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [numericFieldId]: {
          default: 1,
          deprecated: false,
          description: 'Total amount of snares',
          maximum: 50,
          minimum: 1,
          title: 'Number of snares',
        },
      },
      required: [numericFieldId],
    };
    uiSchema = {
      fields: {
        [numericFieldId]: {
          conditionalDependents: ['section-3'],
          parent: parentId,
          placeholder: '1',
        },
      },
    };
  });

  it('transforms a numeric field', () => {
    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '1',
          isActive: true,
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with no conditional dependents', () => {
    uiSchema.fields[numericFieldId].conditionalDependents = [];

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: [],
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '1',
          isActive: true,
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with no description', () => {
    jsonSchema.properties[numericFieldId].description = '';

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 1,
          description: '',
          hint: '1',
          isActive: true,
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with no hint', () => {
    uiSchema.fields[numericFieldId].placeholder = '';

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '',
          isActive: true,
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms an inactive numeric field', () => {
    jsonSchema.properties[numericFieldId].deprecated = true;

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '1',
          isActive: false,
          isRequired: true,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a non-required numeric field', () => {
    jsonSchema.required = [];

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '1',
          isActive: true,
          isRequired: false,
          label: 'Number of snares',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with no label', () => {
    jsonSchema.properties[numericFieldId].title = '';

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 1,
          description: 'Total amount of snares',
          hint: '1',
          isActive: true,
          isRequired: true,
          label: '',
          maxInput: 50,
          minInput: 1,
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });

  it('transforms a numeric field with missing properties', () => {
    delete jsonSchema.properties[numericFieldId].default;
    delete jsonSchema.properties[numericFieldId].deprecated;
    delete jsonSchema.properties[numericFieldId].description;
    delete jsonSchema.properties[numericFieldId].maximum;
    delete jsonSchema.properties[numericFieldId].minimum;
    delete jsonSchema.properties[numericFieldId].title;
    delete uiSchema.fields[numericFieldId].conditionalDependents;
    delete uiSchema.fields[numericFieldId].placeholder;

    const fields = {};
    transformNumericField(numericFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [numericFieldId]: {
        details: {
          conditionalDependents: [],
          defaultInput: '',
          description: '',
          hint: '',
          isActive: true,
          isRequired: true,
          label: '',
          maxInput: '',
          minInput: '',
          value: numericFieldId,
        },
        id: numericFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.NUMERIC,
      },
    });
  });
});

