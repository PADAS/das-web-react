
import { TEXT_ELEMENT_INPUT_TYPES } from '../../../constants';

import transformTextField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformTextField', () => {
  const textFieldId = 'name';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [textFieldId]: {
        details: {
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    };
    jsonSchema = {
      properties: {
        [textFieldId]: {
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
    transformTextField(textFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    });
  });

  it('transforms a text field with no default input', () => {
    delete jsonSchema.properties[textFieldId].default;

    transformTextField(textFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: '',
          description: 'Full name of the suspect',
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    });
  });

  it('transforms a text field with no description', () => {
    jsonSchema.properties[textFieldId].description = '';

    transformTextField(textFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: '',
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    });
  });

  it('transforms a text field with no hint', () => {
    uiSchema.fields[textFieldId].placeholder = '';

    transformTextField(textFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          hint: '',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    });
  });

  it('transforms a short text field', () => {
    uiSchema.fields[textFieldId].inputType = TEXT_ELEMENT_INPUT_TYPES.SHORT;

    transformTextField(textFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          hint: 'John Doe',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    });
  });

  it('transforms a text field with missing properties', () => {
    delete jsonSchema.properties[textFieldId].default;
    delete jsonSchema.properties[textFieldId].description;
    delete uiSchema.fields[textFieldId].inputType;
    delete uiSchema.fields[textFieldId].placeholder;

    transformTextField(textFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [textFieldId]: {
        details: {
          defaultInput: '',
          description: '',
          hint: '',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isRequired: true,
          label: 'Name',
          value: textFieldId,
        },
      },
    });
  });
});
