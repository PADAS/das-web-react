import { FORM_ELEMENT_TYPES } from '../../../constants';

import transformLocationField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformLocationField', () => {
  const locationFieldId = 'weapon-location';
  const parentId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [locationFieldId]: {
          deprecated: false,
          description: 'Location where the weapon was found',
          title: 'Weapon location',
        },
      },
      required: [locationFieldId],
    };
    uiSchema = {
      fields: {
        [locationFieldId]: {
          conditionalDependents: ['section-3'],
          parent: parentId,
        },
      },
    };
  });

  it('transforms a location field', () => {
    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Location where the weapon was found',
          isActive: true,
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a location field with no conditional dependents', () => {
    uiSchema.fields[locationFieldId].conditionalDependents = [];

    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: [],
          description: 'Location where the weapon was found',
          isActive: true,
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a location field with no description', () => {
    jsonSchema.properties[locationFieldId].description = '';

    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: '',
          isActive: true,
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms an inactive location field', () => {
    jsonSchema.properties[locationFieldId].deprecated = true;

    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Location where the weapon was found',
          isActive: false,
          isRequired: true,
          label: 'Weapon location',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a non-required location field', () => {
    jsonSchema.required = [];

    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Location where the weapon was found',
          isActive: true,
          isRequired: false,
          label: 'Weapon location',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a location field with no label', () => {
    jsonSchema.properties[locationFieldId].title = '';

    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: ['section-3'],
          description: 'Location where the weapon was found',
          isActive: true,
          isRequired: true,
          label: '',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });

  it('transforms a location field with missing properties', () => {
    delete jsonSchema.properties[locationFieldId].deprecated;
    delete jsonSchema.properties[locationFieldId].description;
    delete jsonSchema.properties[locationFieldId].title;
    delete uiSchema.fields[locationFieldId].conditionalDependents;

    const fields = {};
    transformLocationField(locationFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [locationFieldId]: {
        details: {
          conditionalDependents: [],
          description: '',
          isActive: true,
          isRequired: true,
          label: '',
          value: locationFieldId,
        },
        id: locationFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.LOCATION,
      },
    });
  });
});
