const transformAttachmentField = (
  attachmentFieldId,
  attachmentFieldName,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const attachmentFieldJSONSchema = jsonSchema.properties[attachmentFieldName];
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const attachmentFieldUISchema =
    uiSchema.fields[attachmentFieldId] ?? uiSchema.fields[attachmentFieldName];

  // Add the attachment field form element specific properties.
  formElements[attachmentFieldId].details = {
    ...formElements[attachmentFieldId].details,
    allowableFileTypes: attachmentFieldUISchema.allowableFileTypes ?? [],
    description: attachmentFieldJSONSchema.description ?? '',
    maxItems: attachmentFieldJSONSchema.maxItems ?? null,
    minItems: attachmentFieldJSONSchema.minItems ?? null,
  };
};

export default transformAttachmentField;
