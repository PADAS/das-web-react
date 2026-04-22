const transformAttachmentField = (
  attachmentFieldId,
  attachmentFieldName,
  _jsonSchema,
  uiSchema,
  formElements,
) => {
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const attachmentFieldUISchema =
    uiSchema.fields[attachmentFieldId] ?? uiSchema.fields[attachmentFieldName];

  // Add the attachment field form element specific properties.
  formElements[attachmentFieldId].details = {
    ...formElements[attachmentFieldId].details,
    allowableFileTypes: attachmentFieldUISchema.allowableFileTypes ?? [],
  };
};

export default transformAttachmentField;
