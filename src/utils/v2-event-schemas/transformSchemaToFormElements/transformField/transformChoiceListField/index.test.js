import {
  CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE,
  CHOICE_LIST_ELEMENT_CHOICE_TYPES,
  CHOICE_LIST_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../constants';

import transformChoiceListField from '.';

describe('Utils - v2-event-schemas - transformSchemaToFormElements - transformField - transformChoiceListField', () => {
  const choiceListFieldId = 'damaged-source';
  const parentId = 'section-1';
  let jsonSchema, uiSchema;
  beforeEach(() => {
    jsonSchema = {
      properties: {
        [choiceListFieldId]: {
          deprecated: false,
          description: 'Select the damaged source',
          title: 'Damaged source',
          type: 'array',
        },
      },
      required: [choiceListFieldId],
    };
    uiSchema = {
      fields: {
        [choiceListFieldId]: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          parent: parentId,
          placeholder: 'Source',
        },
      },
    };
  });

  it('transforms a choice list field', () => {
    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field of type MY_DATA EVENT_TYPES_FROM_EVENT_CATEGORY', () => {
    uiSchema.fields[choiceListFieldId].choices.eventTypeCategories = [
      'category-1',
      'category-2',
    ];
    uiSchema.fields[choiceListFieldId].choices.myDataType =
      CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.EVENT_TYPES_FROM_EVENT_CATEGORY;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: ['category-1', 'category-2'],
            existingChoiceList: [],
            featureCategories: [],
            myDataType:
              CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.EVENT_TYPES_FROM_EVENT_CATEGORY,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field of type EXISTING_CHOICE_LIST', () => {
    uiSchema.fields[choiceListFieldId].choices.existingChoiceList = [
      'field-1',
      'field-2',
    ];
    uiSchema.fields[choiceListFieldId].choices.type =
      CHOICE_LIST_ELEMENT_CHOICE_TYPES.EXISTING_CHOICE_LIST;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: ['field-1', 'field-2'],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.EXISTING_CHOICE_LIST,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field of type MY_DATA FEATURES_FROM_FEATURE_CATEGORY', () => {
    uiSchema.fields[choiceListFieldId].choices.featureCategories = [
      'feature-set-1',
      'feature-set-2',
    ];
    uiSchema.fields[choiceListFieldId].choices.myDataType =
      CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.FEATURES_FROM_FEATURE_CATEGORY;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: ['feature-set-1', 'feature-set-2'],
            myDataType:
              CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.FEATURES_FROM_FEATURE_CATEGORY,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field of type MY_DATA SUBJECTS_FROM_SUBJECT_GROUP', () => {
    uiSchema.fields[choiceListFieldId].choices.subjectGroups = [
      'subject-group-1',
      'subject-group-2',
    ];
    uiSchema.fields[choiceListFieldId].choices.myDataType =
      CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SUBJECTS_FROM_SUBJECT_GROUP;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType:
              CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SUBJECTS_FROM_SUBJECT_GROUP,
            subjectGroups: ['subject-group-1', 'subject-group-2'],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field of type MY_DATA SUBJECTS_FROM_SUBJECT_SUBTYPE', () => {
    uiSchema.fields[choiceListFieldId].choices.subjectSubtypes = [
      'subject-subtype-1',
      'subject-subtype-2',
    ];
    uiSchema.fields[choiceListFieldId].choices.myDataType =
      CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SUBJECTS_FROM_SUBJECT_SUBTYPE;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType:
              CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SUBJECTS_FROM_SUBJECT_SUBTYPE,
            subjectGroups: [],
            subjectSubtypes: ['subject-subtype-1', 'subject-subtype-2'],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field with no conditional dependents', () => {
    uiSchema.fields[choiceListFieldId].conditionalDependents = [];

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: [],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field with no description', () => {
    jsonSchema.properties[choiceListFieldId].description = '';

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: '',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field with no hint', () => {
    uiSchema.fields[choiceListFieldId].placeholder = '';

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: '',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a dropdown choice list field', () => {
    uiSchema.fields[choiceListFieldId].inputType =
      CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms an inactive choice list field', () => {
    jsonSchema.properties[choiceListFieldId].deprecated = true;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: false,
          isRequired: true,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a non-required choice list field', () => {
    jsonSchema.required = [];

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: false,
          label: 'Damaged source',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field with no label', () => {
    jsonSchema.properties[choiceListFieldId].title = '';

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: '',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a single choice list field', () => {
    jsonSchema.properties[choiceListFieldId].type = 'string';

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType: CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.SOURCES,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.MY_DATA,
          },
          conditionalDependents: ['section-3'],
          description: 'Select the damaged source',
          hint: 'Source',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isActive: true,
          isRequired: true,
          label: 'Damaged source',
          multiple: false,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });

  it('transforms a choice list field with missing properties', () => {
    delete jsonSchema.properties[choiceListFieldId].deprecated;
    delete jsonSchema.properties[choiceListFieldId].description;
    delete jsonSchema.properties[choiceListFieldId].title;
    delete uiSchema.fields[choiceListFieldId].choices;
    delete uiSchema.fields[choiceListFieldId].conditionalDependents;
    delete uiSchema.fields[choiceListFieldId].inputType;
    delete uiSchema.fields[choiceListFieldId].placeholder;

    const fields = {};
    transformChoiceListField(choiceListFieldId, jsonSchema, uiSchema, fields);

    expect(fields).toEqual({
      [choiceListFieldId]: {
        details: {
          choices: {
            eventTypeCategories: [],
            existingChoiceList: [],
            featureCategories: [],
            myDataType:
              CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.EVENT_TYPES_FROM_EVENT_CATEGORY,
            subjectGroups: [],
            subjectSubtypes: [],
            type: CHOICE_LIST_ELEMENT_CHOICE_TYPES.EXISTING_CHOICE_LIST,
          },
          conditionalDependents: [],
          description: '',
          hint: '',
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
          isActive: true,
          isRequired: true,
          label: '',
          multiple: true,
          value: choiceListFieldId,
        },
        id: choiceListFieldId,
        isNew: false,
        isSpacer: false,
        parentId,
        type: FORM_ELEMENT_TYPES.CHOICE_LIST,
      },
    });
  });
});
