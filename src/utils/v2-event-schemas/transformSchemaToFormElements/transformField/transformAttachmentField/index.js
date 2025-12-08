const transformAttachmentField = (
  attachmentFieldId,
  _jsonSchema,
  uiSchema,
  formElements,
) => {
  const attachmentFieldUISchema = uiSchema.fields[attachmentFieldId];

  // Add the attachment field specific properties to its node in the form
  // elements object.
  formElements[attachmentFieldId].details = {
    ...formElements[attachmentFieldId].details,
    allowableFileTypes: attachmentFieldUISchema.allowableFileTypes ?? [],
  };
};

export default transformAttachmentField;
