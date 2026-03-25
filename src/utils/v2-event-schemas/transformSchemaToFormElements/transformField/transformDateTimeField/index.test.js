import {
  DATE_TIME_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../constants';

import transformDateTimeField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformDateTimeField', () => {
  const dateTimeFieldId = 'date-of-birth';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [dateTimeFieldId]: {
        details: {
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    };
    jsonSchema = {
      properties: {
        [dateTimeFieldId]: {
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
    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date-time format date time field', () => {
    jsonSchema.properties[dateTimeFieldId].format = 'date-time';

    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a time format date time field', () => {
    jsonSchema.properties[dateTimeFieldId].format = 'time';

    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: 'Date of birth of the suspect',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });

  it('transforms a date time field with missing properties', () => {
    delete jsonSchema.properties[dateTimeFieldId].description;
    delete jsonSchema.properties[dateTimeFieldId].format;

    transformDateTimeField(dateTimeFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [dateTimeFieldId]: {
        details: {
          description: '',
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
          isRequired: true,
          label: 'Date of birth',
          value: dateTimeFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    });
  });
});
