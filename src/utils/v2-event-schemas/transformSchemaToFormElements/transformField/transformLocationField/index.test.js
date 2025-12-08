import transformLocationField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformLocationField', () => {
  const locationFieldId = 'weapon-location';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [locationFieldId]: {
        details: {
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
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
      },
    });
  });

  it('transforms a location field with no description', () => {
    jsonSchema.properties[locationFieldId].description = '';

    transformLocationField(locationFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [locationFieldId]: {
        details: {
          description: '',
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
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
      },
    });
  });
});
