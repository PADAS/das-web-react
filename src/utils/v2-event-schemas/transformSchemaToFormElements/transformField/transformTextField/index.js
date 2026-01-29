import { TEXT_ELEMENT_INPUT_TYPES } from '../../../constants';

const transformTextField = (
  textFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const textFieldJSONSchema = jsonSchema.properties[textFieldId];
  const textFieldUISchema = uiSchema.fields[textFieldId];

  // Add the text field form element specific properties.
  formElements[textFieldId].details = {
    ...formElements[textFieldId].details,
    defaultInput: textFieldJSONSchema.default ?? '',
    description: textFieldJSONSchema.description ?? '',
    hint: textFieldUISchema.placeholder ?? '',
    inputType: textFieldUISchema.inputType ?? TEXT_ELEMENT_INPUT_TYPES.SHORT,
  };
};

export default transformTextField;
