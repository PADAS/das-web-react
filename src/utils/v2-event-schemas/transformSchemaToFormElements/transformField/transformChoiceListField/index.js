import {
  CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE,
  CHOICE_LIST_ELEMENT_CHOICE_TYPES,
  CHOICE_LIST_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../constants';

const transformChoiceListField = (
  choiceListFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const choiceListFieldJSONSchema = jsonSchema.properties[choiceListFieldId];
  const choiceListFieldUISchema = uiSchema.fields[choiceListFieldId];

  // Add the choice list field node to the form elements object.
  formElements[choiceListFieldId] = {
    details: {
      choices: {
        eventTypeCategories:
          choiceListFieldUISchema.choices?.eventTypeCategories ?? [],
        existingChoiceList:
          choiceListFieldUISchema.choices?.existingChoiceList ?? [],
        featureCategories:
          choiceListFieldUISchema.choices?.featureCategories ?? [],
        myDataType:
          choiceListFieldUISchema.choices?.myDataType ??
          CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE.EVENT_TYPES_FROM_EVENT_CATEGORY,
        subjectGroups: choiceListFieldUISchema.choices?.subjectGroups ?? [],
        subjectSubtypes: choiceListFieldUISchema.choices?.subjectSubtypes ?? [],
        type:
          choiceListFieldUISchema.choices?.type ??
          CHOICE_LIST_ELEMENT_CHOICE_TYPES.EXISTING_CHOICE_LIST,
      },
      conditionalDependents:
        choiceListFieldUISchema.conditionalDependents ?? [],
      description: choiceListFieldJSONSchema.description ?? '',
      hint: choiceListFieldUISchema.placeholder ?? '',
      inputType:
        choiceListFieldUISchema.inputType ??
        CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
      isActive: !choiceListFieldJSONSchema.deprecated,
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === choiceListFieldId,
      ),
      label: choiceListFieldJSONSchema.title ?? '',
      multiple: choiceListFieldJSONSchema.type === 'array',
      value: choiceListFieldId,
    },
    id: choiceListFieldId,
    isNew: false,
    isSpacer: false,
    parentId: choiceListFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.CHOICE_LIST,
  };
};

export default transformChoiceListField;
