import {
  CHOICE_LIST_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../constants';

import transformChoiceListField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformChoiceListField', () => {
  const choiceListFieldName = 'damaged-source';
  let choiceListFieldId, formElements, jsonSchema, parentId, uiSchema;
  beforeEach(() => {
    parentId = 'section-1';
    choiceListFieldId = choiceListFieldName;
    formElements = {
      [choiceListFieldId]: {
        details: {
          isRequired: true,
          label: 'Damaged source',
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    };
    jsonSchema = {
      properties: {
        [choiceListFieldName]: {
          description: 'Select the damaged source',
          items: {
            anyOf: [
              {
                enum: ['source-1', 'source-2'],
                'x-enumExtra': {
                  'source-1': {
                    description: 'radio_manufacturer',
                    display: 'Ranger Radio',
                  },
                  'source-2': {
                    description: 'collar_manufacturer',
                    display: 'Elephant Collar',
                  },
                },
              },
            ],
          },
          type: 'array',
        },
      },
    };
    uiSchema = {
      fields: {
        [choiceListFieldId]: {
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          placeholder: 'Source',
        },
      },
    };
  });

  it('transforms a choice list field', () => {
    transformChoiceListField(
      choiceListFieldId,
      choiceListFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [
            {
              description: 'radio_manufacturer',
              display: 'Ranger Radio',
              value: 'source-1',
            },
            {
              description: 'collar_manufacturer',
              display: 'Elephant Collar',
              value: 'source-2',
            },
          ],
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field stored by name in uiSchema.fields', () => {
    parentId = 'collection-1.collection-2';
    choiceListFieldId = `${parentId}.${choiceListFieldName}`;

    formElements = {
      [choiceListFieldId]: {
        details: {
          isRequired: true,
          label: 'Damaged source',
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    };
    uiSchema = {
      fields: {
        [choiceListFieldName]: {
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          placeholder: 'Source',
        },
      },
    };

    transformChoiceListField(
      choiceListFieldId,
      choiceListFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [
            {
              description: 'radio_manufacturer',
              display: 'Ranger Radio',
              value: 'source-1',
            },
            {
              description: 'collar_manufacturer',
              display: 'Elephant Collar',
              value: 'source-2',
            },
          ],
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms multiple choices subschemas to options', () => {
    jsonSchema.properties[choiceListFieldName].items.anyOf = [
      ...jsonSchema.properties[choiceListFieldName].items.anyOf,
      {
        enum: ['source-3', 'source-4'],
        'x-enumExtra': {
          'source-3': {
            description: 'collar_manufacturer_2',
            display: 'Rhino Collar',
          },
          'source-4': {
            description: 'sensor_manufacturer',
            display: 'Static Weather Sensor',
          },
        },
      },
      {
        enum: ['source-5'],
        'x-enumExtra': {
          'source-5': {
            description: 'tracker_manufacturer',
            display: 'Vehicle Tracker',
          },
        },
      },
    ];

    transformChoiceListField(
      choiceListFieldId,
      choiceListFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [
            {
              description: 'radio_manufacturer',
              display: 'Ranger Radio',
              value: 'source-1',
            },
            {
              description: 'collar_manufacturer',
              display: 'Elephant Collar',
              value: 'source-2',
            },
            {
              description: 'collar_manufacturer_2',
              display: 'Rhino Collar',
              value: 'source-3',
            },
            {
              description: 'sensor_manufacturer',
              display: 'Static Weather Sensor',
              value: 'source-4',
            },
            {
              description: 'tracker_manufacturer',
              display: 'Vehicle Tracker',
              value: 'source-5',
            },
          ],
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a single choice list field', () => {
    jsonSchema.properties[choiceListFieldName].anyOf = jsonSchema.properties[choiceListFieldName].items.anyOf;
    delete jsonSchema.properties[choiceListFieldName].items;
    jsonSchema.properties[choiceListFieldName].type = 'string';

    transformChoiceListField(
      choiceListFieldId,
      choiceListFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true,
          label: 'Damaged source',
          multiple: false,
          options: [
            {
              description: 'radio_manufacturer',
              display: 'Ranger Radio',
              value: 'source-1',
            },
            {
              description: 'collar_manufacturer',
              display: 'Elephant Collar',
              value: 'source-2',
            },
          ],
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('produces empty options when a subschema has no enum key (backend empty-choices fix)', () => {
    jsonSchema.properties[choiceListFieldName].items.anyOf = [
      { 'not': {}, 'x-enumExtra': {} },
    ];

    transformChoiceListField(
      choiceListFieldId,
      choiceListFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements[choiceListFieldId].details.options).toEqual([]);
  });

  it('transforms a choice list field with missing properties', () => {
    delete jsonSchema.properties[choiceListFieldName].description;
    delete jsonSchema.properties[choiceListFieldName].items.anyOf;
    delete uiSchema.fields[choiceListFieldId].inputType;
    delete uiSchema.fields[choiceListFieldId].placeholder;

    transformChoiceListField(
      choiceListFieldId,
      choiceListFieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: '',
          hint: '',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [],
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });
});
