import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformLocationField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformLocationField', () => {
  const locationFieldId = 'weapon-location';
  const parentId = 'section-1';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [locationFieldId]: {
        details: {
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    };
    jsonSchema = {
      properties: {
        [locationFieldId]: {
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
    transformLocationField(locationFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [locationFieldId]: {
        details: {
          description: 'Location where the weapon was found',
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a location field with missing properties', () => {
    delete jsonSchema.properties[locationFieldId].description;

    transformLocationField(locationFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [locationFieldId]: {
        details: {
          description: '',
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });
});
