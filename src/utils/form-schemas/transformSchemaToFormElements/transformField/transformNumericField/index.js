const transformNumericField = (
  numericFieldId,
  numericFieldName,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const numericFieldJSONSchema = jsonSchema.properties[numericFieldName];
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const numericFieldUISchema =
    uiSchema.fields[numericFieldId] ?? uiSchema.fields[numericFieldName];

  // Add the numeric field form element specific properties.
  formElements[numericFieldId].details = {
    ...formElements[numericFieldId].details,
    defaultInput: numericFieldJSONSchema.default ?? null,
    description: numericFieldJSONSchema.description ?? '',
    hint: numericFieldUISchema.placeholder ?? '',
    maxInput: numericFieldJSONSchema.maximum ?? null,
    minInput: numericFieldJSONSchema.minimum ?? null,
  };
};

export default transformNumericField;
