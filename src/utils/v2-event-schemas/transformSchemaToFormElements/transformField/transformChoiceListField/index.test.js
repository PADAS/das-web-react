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
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
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
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
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
              const: 'source-1',
              title: 'Ranger Radio',
            },
            {
              const: 'source-2',
              title: 'Elephant Collar',
            },
          ],
          value: choiceListFieldName,
        },
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
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
