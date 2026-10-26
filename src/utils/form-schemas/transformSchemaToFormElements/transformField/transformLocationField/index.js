const transformLocationField = (
  locationFieldId,
  locationFieldName,
  jsonSchema,
  _uiSchema,
  formElements,
) => {
  const locationFieldJSONSchema = jsonSchema.properties[locationFieldName];

  // Add the location field form element specific properties.
  formElements[locationFieldId].details = {
    ...formElements[locationFieldId].details,
    description: locationFieldJSONSchema.description ?? '',
  };
};

export default transformLocationField;
