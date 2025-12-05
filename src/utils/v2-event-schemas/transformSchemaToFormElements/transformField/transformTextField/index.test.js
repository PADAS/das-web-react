import { FORM_ELEMENT_TYPES } from '../../../constants';
import { TEXT_ELEMENT_INPUT_TYPES } from '../../../constants';

import transformTextField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformTextField', () => {
  const textFieldId = 'name';
  const parentId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [textFieldId]: {
          default: 'John Doe',
          deprecated: false,
          description: 'Full name of the suspect',
          title: 'Name',
        },
      },
      required: [textFieldId],
    };
    uiSchema = {
      fields: {
        [textFieldId]: {
          conditionalDependents: ['section-3'],
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          parent: parentId,
          placeholder: 'John Doe',
        },
      },
    };
  });

  it('transforms a text field', () => {
    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: true,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with no conditional dependents', () => {
    uiSchema.fields[textFieldId].conditionalDependents = [];

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: [],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: true,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with no default input', () => {
    delete jsonSchema.properties[textFieldId].default;

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: '',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: true,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with no description', () => {
    jsonSchema.properties[textFieldId].description = '';

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: '',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: true,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a short text field', () => {
    uiSchema.fields[textFieldId].inputType = TEXT_ELEMENT_INPUT_TYPES.SHORT;

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isActive: true,
          isRequired: true,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms an inactive text field', () => {
    jsonSchema.properties[textFieldId].deprecated = true;

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: false,
          isRequired: true,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a non-required text field', () => {
    jsonSchema.required = [];

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: false,
          label: 'Name',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with no label', () => {
    jsonSchema.properties[textFieldId].title = '';

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: true,
          label: '',
          placeholder: 'John Doe',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with no placeholder', () => {
    uiSchema.fields[textFieldId].placeholder = '';

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          defaultInput: 'John Doe',
          description: 'Full name of the suspect',
          inputType: TEXT_ELEMENT_INPUT_TYPES.LONG,
          isActive: true,
          isRequired: true,
          label: 'Name',
          placeholder: '',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });

  it('transforms a text field with missing properties', () => {
    delete jsonSchema.properties[textFieldId].default;
    delete jsonSchema.properties[textFieldId].deprecated;
    delete jsonSchema.properties[textFieldId].description;
    delete jsonSchema.properties[textFieldId].title;
    delete uiSchema.fields[textFieldId].conditionalDependents;
    delete uiSchema.fields[textFieldId].inputType;
    delete uiSchema.fields[textFieldId].placeholder;

    const fields = {};
    transformTextField(textFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [textFieldId]: {
        details: {
          conditionalDependents: [],
          defaultInput: '',
          description: '',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isActive: true,
          isRequired: true,
          label: '',
          placeholder: '',
          value: textFieldId,
        },
        id: textFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    });
  });
});

