const transformAttachmentField = (
  attachmentFieldId,
  _jsonSchema,
  uiSchema,
  formElements,
) => {
  const attachmentFieldUISchema = uiSchema.fields[attachmentFieldId];

  // Add the attachment field form element specific properties.
  formElements[attachmentFieldId].details = {
    ...formElements[attachmentFieldId].details,
    allowableFileTypes: attachmentFieldUISchema.allowableFileTypes ?? [],
  };
};

export default transformAttachmentField;
