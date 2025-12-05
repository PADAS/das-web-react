import { FORM_ELEMENT_TYPES, TEXT_ELEMENT_INPUT_TYPES } from '../../../constants';

const transformTextField = (
  textFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const textFieldJSONSchema = jsonSchema.properties[textFieldId];
  const textFieldUISchema = uiSchema.fields[textFieldId];

  // Add the text field node to the form elements object.
  formElements[textFieldId] = {
    details: {
      conditionalDependents: textFieldUISchema.conditionalDependents ?? [],
      defaultInput: textFieldJSONSchema.default ?? '',
      description: textFieldJSONSchema.description ?? '',
      inputType: textFieldUISchema.inputType ?? TEXT_ELEMENT_INPUT_TYPES.SHORT,
      isActive: !textFieldJSONSchema.deprecated,
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === textFieldId,
      ),
      label: textFieldJSONSchema.title ?? '',
      placeholder: textFieldUISchema.placeholder ?? '',
      value: textFieldId,
    },
    id: textFieldId,
    isNew: false,
    isSpacer: false,
    parentId: textFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.TEXT,
  };
};

export default transformTextField;
