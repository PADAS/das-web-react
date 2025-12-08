const transformLocationField = (
  locationFieldId,
  jsonSchema,
  _uiSchema,
  formElements,
) => {
  const locationFieldJSONSchema = jsonSchema.properties[locationFieldId];

  // Add the location field specific properties to its node in the form
  // elements object.
  formElements[locationFieldId].details = {
    ...formElements[locationFieldId].details,
    description: locationFieldJSONSchema.description ?? '',
  };
};

export default transformLocationField;
