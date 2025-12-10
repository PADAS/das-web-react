import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../../constants';

import transformChoiceListField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformChoiceListField', () => {
  const choiceListFieldId = 'damaged-source';
  let formElements, jsonSchema, uiSchema;
  beforeEach(() => {
    formElements = {
      [choiceListFieldId]: {
        details: {
          isRequired: true,
          label: 'Damaged source',
          value: choiceListFieldId,
        },
      },
    };
    jsonSchema = {
      properties: {
        [choiceListFieldId]: {
          description: 'Select the damaged source',
          items: {
            anyOf: [
              {
                oneOf: [
                  {
                    const: 'source-1',
                    title: 'Ranger Radio',
                  },
                  {
                    const: 'source-2',
                    title: 'Elephant Collar',
                  },
                ],
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
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

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
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
          ],
          value: choiceListFieldId,
        },
      },
    });
  });

  it('transforms multiple choices subschemas to options', () => {
    jsonSchema.properties[choiceListFieldId].items.anyOf = [
      ...jsonSchema.properties[choiceListFieldId].items.anyOf,
      {
        oneOf: [
          {
            const: 'source-3',
            title: 'Rhino Collar',
          },
          {
            const: 'source-4',
            title: 'Static Wheather Sensor',
          },
        ],
      },
      {
        oneOf: [
          {
            const: 'source-5',
            title: 'Vehicle Tracker',
          },
        ],
      },
    ];

    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

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
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
            {
              const: 'source-3',
              title: 'Rhino Collar',
            },
            {
              const: 'source-4',
              title: 'Static Wheather Sensor',
            },
            {
              const: 'source-5',
              title: 'Vehicle Tracker',
            },
          ],
          value: choiceListFieldId,
        },
      },
    });
  });

  it('transforms a choice list field with no description', () => {
    jsonSchema.properties[choiceListFieldId].description = '';

    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: '',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [
            {
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
          ],
          value: choiceListFieldId,
        },
      },
    });
  });

  it('transforms a choice list field with no hint', () => {
    uiSchema.fields[choiceListFieldId].placeholder = '';

    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: 'Select the damaged source',
          hint: '',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [
            {
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
          ],
          value: choiceListFieldId,
        },
      },
    });
  });

  it('transforms a dropdown choice list field', () => {
    uiSchema.fields[choiceListFieldId].inputType =
      CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN;

    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

    expect(formElements).toEqual({
      [choiceListFieldId]: {
        details: {
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          options: [
            {
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
          ],
          value: choiceListFieldId,
        },
      },
    });
  });

  it('transforms a single choice list field', () => {
    jsonSchema.properties[choiceListFieldId].anyOf = jsonSchema.properties[choiceListFieldId].items.anyOf;
    delete jsonSchema.properties[choiceListFieldId].items;
    jsonSchema.properties[choiceListFieldId].type = 'string';

    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

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
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
          ],
          value: choiceListFieldId,
        },
      },
    });
  });

  it('transforms a choice list field with missing properties', () => {
    delete jsonSchema.properties[choiceListFieldId].description;
    delete jsonSchema.properties[choiceListFieldId].items.anyOf;
    delete uiSchema.fields[choiceListFieldId].inputType;
    delete uiSchema.fields[choiceListFieldId].placeholder;

    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, formElements);

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
          value: choiceListFieldId,
        },
      },
    });
  });
});
