import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformBooleanField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformBooleanField', () => {
  const booleanFieldId = 'is-animal-injured';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [booleanFieldId]: {
        details: {
          isRequired: true,
          label: 'Is animal injured?',
          value: booleanFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    };
    jsonSchema = {
      properties: {
        [booleanFieldId]: {
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
    transformBooleanField(booleanFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [booleanFieldId]: {
        details: {
          defaultInput: true,
          description: 'Does the animal show any signs of injury?',
          isRequired: true,
          label: 'Is animal injured?',
          value: booleanFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    });
  });

  it('transforms a boolean field with missing properties', () => {
    delete jsonSchema.properties[booleanFieldId].default;
    delete jsonSchema.properties[booleanFieldId].description;

    transformBooleanField(booleanFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [booleanFieldId]: {
        details: {
          defaultInput: false,
          description: '',
          isRequired: true,
          label: 'Is animal injured?',
          value: booleanFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.BOOLEAN,
      },
    });
  });
});
