const transformBooleanField = (
  booleanFieldId,
  booleanFieldName,
  jsonSchema,
  _uiSchema,
  formElements,
) => {
  const booleanFieldJSONSchema = jsonSchema.properties[booleanFieldName];

  // Add the boolean field form element specific properties.
  formElements[booleanFieldId].details = {
    ...formElements[booleanFieldId].details,
    defaultInput: booleanFieldJSONSchema.default ?? false,
    description: booleanFieldJSONSchema.description ?? '',
  };
};

export default transformBooleanField;
