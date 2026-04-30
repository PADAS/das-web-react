import {
  DATE_TIME_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../constants';

import transformDateTimeField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformDateTimeField', () => {
  const dateTimeFieldName = 'date-of-birth';
  let dateTimeFieldId, formElements, jsonSchema, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    dateTimeFieldId = dateTimeFieldName;
    formElements = {
      [dateTimeFieldId]: {
        details: {
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    };
    jsonSchema = {
      properties: {
        [dateTimeFieldName]: {
          description: 'Date of birth of the suspect',
          format: 'date',
        },
      },
    };
    uiSchema = {
      fields: {
        [dateTimeFieldId]: {},
      },
    };
  });

  it('transforms a date time field', () => {
    transformDateTimeField(
      dateTimeFieldId,
      dateTimeFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date-time format date time field', () => {
    jsonSchema.properties[dateTimeFieldName].format = 'date-time';

    transformDateTimeField(
      dateTimeFieldId,
      dateTimeFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a time format date time field', () => {
    jsonSchema.properties[dateTimeFieldName].format = 'time';

    transformDateTimeField(
      dateTimeFieldId,
      dateTimeFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date time field with missing properties', () => {
    delete jsonSchema.properties[dateTimeFieldName].description;
    delete jsonSchema.properties[dateTimeFieldName].format;

    transformDateTimeField(
      dateTimeFieldId,
      dateTimeFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: '',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });
});
