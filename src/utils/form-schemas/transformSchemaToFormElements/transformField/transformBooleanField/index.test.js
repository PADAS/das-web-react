import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformBooleanField from '.';

describe('Utils - form-schemas - transformSchemaToFormElements - transformField - transformBooleanField', () => {
  const booleanFieldName = 'is-animal-injured';
  let booleanFieldId, formElements, jsonSchema, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    booleanFieldId = booleanFieldName;
    formElements = {
      [booleanFieldId]: {
        details: {
          isRequired: true,
          label: 'Is animal injured?',
          value: booleanFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    };
    jsonSchema = {
      properties: {
        [booleanFieldName]: {
          default: true,
          description: 'Does the animal show any signs of injury?',
        },
      },
    };
    uiSchema = {
      fields: {
        [booleanFieldId]: {},
      },
    };
  });

  it('transforms a boolean field', () => {
    transformBooleanField(booleanFieldId, booleanFieldName, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [booleanFieldId]: {
        details: {
          defaultInput: true,
          description: 'Does the animal show any signs of injury?',
          isRequired: true,
          label: 'Is animal injured?',
          value: booleanFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    });
  });

  it('transforms a boolean field with missing properties', () => {
    delete jsonSchema.properties[booleanFieldName].default;
    delete jsonSchema.properties[booleanFieldName].description;

    transformBooleanField(booleanFieldId, booleanFieldName, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [booleanFieldId]: {
        details: {
          defaultInput: false,
          description: '',
          isRequired: true,
          label: 'Is animal injured?',
          value: booleanFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    });
  });
});
