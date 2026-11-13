import {
  TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN,
  TEXT_ELEMENT_FORMAT_VALIDATIONS,
  TEXT_ELEMENT_INPUT_TYPES,
} from '../../../constants';

const TEXT_JSON_SCHEMA_FORMAT_TO_FORMAT_VALIDATION = {
  email: TEXT_ELEMENT_FORMAT_VALIDATIONS.EMAIL,
  uri: TEXT_ELEMENT_FORMAT_VALIDATIONS.URI,
  uuid: TEXT_ELEMENT_FORMAT_VALIDATIONS.UUID,
};

const transformTextField = (
  textFieldId,
  textFieldName,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const textFieldJSONSchema = jsonSchema.properties[textFieldName];
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const textFieldUISchema =
    uiSchema.fields[textFieldId] ?? uiSchema.fields[textFieldName];

  // Get the text field format validation.
  let formatValidation = '';
  if (
    textFieldJSONSchema.format &&
    TEXT_JSON_SCHEMA_FORMAT_TO_FORMAT_VALIDATION[textFieldJSONSchema.format]
  ) {
    formatValidation =
      TEXT_JSON_SCHEMA_FORMAT_TO_FORMAT_VALIDATION[textFieldJSONSchema.format];
  } else if (
    textFieldJSONSchema.pattern ===
    TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN
  ) {
    formatValidation = TEXT_ELEMENT_FORMAT_VALIDATIONS.ALPHANUMERIC;
  }

  // Add the text field form element specific properties.
  formElements[textFieldId].details = {
    ...formElements[textFieldId].details,
    defaultInput: textFieldJSONSchema.default ?? '',
    description: textFieldJSONSchema.description ?? '',
    formatValidation,
    hint: textFieldUISchema.placeholder ?? '',
    inputType: textFieldUISchema.inputType ?? TEXT_ELEMENT_INPUT_TYPES.SHORT,
  };
};

export default transformTextField;
