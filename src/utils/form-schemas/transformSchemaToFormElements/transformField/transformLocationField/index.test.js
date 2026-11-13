import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformLocationField from '.';

describe('Utils - form-schemas - transformSchemaToFormElements - transformField - transformLocationField', () => {
  const locationFieldName = 'weapon-location';
  let formElements, jsonSchema, locationFieldId, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    locationFieldId = locationFieldName;
    formElements = {
      [locationFieldId]: {
        details: {
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    };
    jsonSchema = {
      properties: {
        [locationFieldName]: {
          description: 'Location where the weapon was found',
        },
      },
    };
    uiSchema = {
      fields: {
        [locationFieldId]: {},
      },
    };
  });

  it('transforms a location field', () => {
    transformLocationField(
      locationFieldId,
      locationFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [locationFieldId]: {
        details: {
          description: 'Location where the weapon was found',
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a location field with missing properties', () => {
    delete jsonSchema.properties[locationFieldName].description;

    transformLocationField(
      locationFieldId,
      locationFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [locationFieldId]: {
        details: {
          description: '',
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });
});
