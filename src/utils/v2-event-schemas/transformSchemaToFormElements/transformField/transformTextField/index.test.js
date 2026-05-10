import {
  FORM_ELEMENT_TYPES,
  TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN,
  TEXT_ELEMENT_FORMAT_VALIDATIONS,
  TEXT_ELEMENT_INPUT_TYPES,
} from '../../../constants';

import transformTextField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformTextField', () => {
  const textFieldName = 'name';
  let formElements, jsonSchema, parentId, textFieldId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    textFieldId = textFieldName;
    formElements = {
      [textFieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    };
    jsonSchema = {
      properties: {
        [textFieldName]: {
          default: 'John Doe',
          description: 'Full name of the suspect',
        },
      },
    };
    uiSchema = {
      fields: {
        [textFieldId]: {
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          placeholder: 'John Doe',
        },
      },
    };
  });

  it('transforms a text field', () => {
    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          formatValidation: '',
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field stored by name in uiSchema.fields', () => {
    parentId = 'collection-1.collection-2';
    textFieldId = `${parentId}.${textFieldName}`;

    formElements = {
      [textFieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    };
    uiSchema = {
      fields: {
        [textFieldName]: {
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          placeholder: 'John Doe',
        },
      },
    };

    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          formatValidation: '',
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms an alphanumeric format text field', () => {
    jsonSchema.properties[textFieldName].pattern =
      TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN;

    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          formatValidation: TEXT_ELEMENT_FORMAT_VALIDATIONS.ALPHANUMERIC,
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms an email format text field', () => {
    jsonSchema.properties[textFieldName].format = 'email';

    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          formatValidation: TEXT_ELEMENT_FORMAT_VALIDATIONS.EMAIL,
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a URI format text field', () => {
    jsonSchema.properties[textFieldName].format = 'uri';

    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          formatValidation: TEXT_ELEMENT_FORMAT_VALIDATIONS.URI,
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a UUID format text field', () => {
    jsonSchema.properties[textFieldName].format = 'uuid';

    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          formatValidation: TEXT_ELEMENT_FORMAT_VALIDATIONS.UUID,
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with missing properties', () => {
    delete jsonSchema.properties[textFieldName].default;
    delete jsonSchema.properties[textFieldName].description;
    delete uiSchema.fields[textFieldId].inputType;
    delete uiSchema.fields[textFieldId].placeholder;

    transformTextField(
      textFieldId,
      textFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: '',
          description: '',
          formatValidation: '',
          hint: '',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isRequired: true,
          label: 'Name',
          value: textFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });
});
