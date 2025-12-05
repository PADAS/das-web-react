import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES } from '../../../constants';

import transformDateTimeField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformDateTimeField', () => {
  const dateTimeFieldId = 'date-of-birth';
  const parentId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [dateTimeFieldId]: {
          deprecated: false,
          description: 'Date of birth of the suspect',
          format: 'date',
          title: 'Date of birth',
        },
      },
      required: [dateTimeFieldId],
    };
    uiSchema = {
      fields: {
        [dateTimeFieldId]: {
          conditionalDependents: ['section-3'],
          parent: parentId,
        },
      },
    };
  });

  it('transforms a date time field', () => {
    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isActive: true,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date time field with no conditional dependents', () => {
    uiSchema.fields[dateTimeFieldId].conditionalDependents = [];

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: [],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isActive: true,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date time field with no description', () => {
    jsonSchema.properties[dateTimeFieldId].description = '';

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: '',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isActive: true,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date-time format date time field', () => {
    jsonSchema.properties[dateTimeFieldId].format = 'date-time';

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isActive: true,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a time format date time field', () => {
    jsonSchema.properties[dateTimeFieldId].format = 'time';

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
          isActive: true,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms an inactive date time field', () => {
    jsonSchema.properties[dateTimeFieldId].deprecated = true;

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isActive: false,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a non-required date time field', () => {
    jsonSchema.required = [];

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isActive: true,
          isRequired: false,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date time field with no label', () => {
    jsonSchema.properties[dateTimeFieldId].title = '';

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isActive: true,
          isRequired: true,
          label: '',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date time field with missing properties', () => {
    delete jsonSchema.properties[dateTimeFieldId].deprecated;
    delete jsonSchema.properties[dateTimeFieldId].description;
    delete jsonSchema.properties[dateTimeFieldId].format;
    delete jsonSchema.properties[dateTimeFieldId].title;
    delete uiSchema.fields[dateTimeFieldId].conditionalDependents;

    const fields = {};
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [dateTimeFieldId]: {
        details: {
          conditionalDependents: [],
          description: '',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isActive: true,
          isRequired: true,
          label: '',
          value: dateTimeFieldId,
        },
        id: dateTimeFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });
});
