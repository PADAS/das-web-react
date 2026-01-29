const transformBooleanField = (
  booleanFieldId,
  jsonSchema,
  _uiSchema,
  formElements,
) => {
  const booleanFieldJSONSchema = jsonSchema.properties[booleanFieldId];

  // Add the boolean field form element specific properties.
  formElements[booleanFieldId].details = {
    ...formElements[booleanFieldId].details,
    defaultInput: booleanFieldJSONSchema.default ?? false,
    description: booleanFieldJSONSchema.description ?? '',
  };
};

export default transformBooleanField;
