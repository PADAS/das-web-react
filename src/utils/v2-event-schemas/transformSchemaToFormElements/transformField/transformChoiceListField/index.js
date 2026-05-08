import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../../constants';

const transformChoiceListField = (
  choiceListFieldId,
  choiceListFieldName,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const choiceListFieldJSONSchema = jsonSchema.properties[choiceListFieldName];
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const choiceListFieldUISchema =
    uiSchema.fields[choiceListFieldId] ?? uiSchema.fields[choiceListFieldName];

  // Infer if it is a multiple choice list and transform the choices subschemas
  // in an options array.
  const isMultipleChoiceList = choiceListFieldJSONSchema.type === 'array';
  const choicesSubschemas = isMultipleChoiceList
    ? choiceListFieldJSONSchema.items.anyOf
    : choiceListFieldJSONSchema.anyOf;
  const options = (choicesSubschemas ?? [])
    .flatMap((choicesSubschema) => choicesSubschema.enum.map((optionValue) => {
      const optionExtra = choicesSubschema['x-enumExtra'][optionValue];

      return {
        description: optionExtra.description,
        display: optionExtra.display,
        value: optionValue,
      };
    }));

  // Add the choice list field form element specific properties.
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
