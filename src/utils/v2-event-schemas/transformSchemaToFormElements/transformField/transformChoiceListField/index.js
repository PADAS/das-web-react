import {
  CHOICE_LIST_ELEMENT_CHOICE_MY_DATA_TYPE,
  CHOICE_LIST_ELEMENT_CHOICE_TYPES,
  CHOICE_LIST_ELEMENT_INPUT_TYPES,
} from '../../../constants';

const transformChoiceListField = (
  choiceListFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const choiceListFieldJSONSchema = jsonSchema.properties[choiceListFieldId];
  const choiceListFieldUISchema = uiSchema.fields[choiceListFieldId];

  // Infer if it is a multiple choice list and transform the choices subschemas
  // in an options array.
  const isMultipleChoiceList = choiceListFieldJSONSchema.type === 'array';
  const options = (isMultipleChoiceList ? choiceListFieldJSONSchema.items.anyOf : choiceListFieldJSONSchema.anyOf)
    .flatMap((choicesSubschema) => choicesSubschema.oneOf);

  // Add the choice list field specific properties to its node in the form
  // elements object.
  formElements[choiceListFieldId].details = {
    ...formElements[choiceListFieldId].details,
    description: choiceListFieldJSONSchema.description ?? '',
    hint: choiceListFieldUISchema.placeholder ?? '',
    inputType:
      choiceListFieldUISchema.inputType ??
      CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
    multiple: isMultipleChoiceList,
    options,
  };
};

export default transformChoiceListField;
