const transformNumericField = (
  numericFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const numericFieldJSONSchema = jsonSchema.properties[numericFieldId];
  const numericFieldUISchema = uiSchema.fields[numericFieldId];

  // Add the numeric field specific properties to its node in the form elements
  // object.
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
