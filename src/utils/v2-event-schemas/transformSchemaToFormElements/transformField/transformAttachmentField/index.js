import { FORM_ELEMENT_TYPES } from '../../../constants';

const transformAttachmentField = (
  attachmentFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const attachmentFieldJSONSchema = jsonSchema.properties[attachmentFieldId];
  const attachmentFieldUISchema = uiSchema.fields[attachmentFieldId];

  // Add the attachment field node to the form elements object.
  formElements[attachmentFieldId] = {
    details: {
      allowableFileTypes: attachmentFieldUISchema.allowableFileTypes ?? [],
      conditionalDependents: attachmentFieldUISchema.conditionalDependents ?? [],
      isActive: !attachmentFieldJSONSchema.deprecated,
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === attachmentFieldId,
      ),
      label: attachmentFieldJSONSchema.title ?? '',
      value: attachmentFieldId,
    },
    id: attachmentFieldId,
    isNew: false,
    isSpacer: false,
    parentId: attachmentFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.ATTACHMENT,
  };
};

export default transformAttachmentField;
