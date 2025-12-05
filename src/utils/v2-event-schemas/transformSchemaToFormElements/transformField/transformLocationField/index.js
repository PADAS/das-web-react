import { FORM_ELEMENT_TYPES } from '../../../constants';

const transformLocationField = (
  locationFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const locationFieldJSONSchema = jsonSchema.properties[locationFieldId];
  const locationFieldUISchema = uiSchema.fields[locationFieldId];

  // Add the location field node to the form elements object.
  formElements[locationFieldId] = {
    details: {
      conditionalDependents: locationFieldUISchema.conditionalDependents ?? [],
      description: locationFieldJSONSchema.description ?? '',
      isActive: !locationFieldJSONSchema.deprecated,
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === locationFieldId,
      ),
      label: locationFieldJSONSchema.title ?? '',
      value: locationFieldId,
    },
    id: locationFieldId,
    isNew: false,
    isSpacer: false,
    parentId: locationFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.LOCATION,
  };
};

export default transformLocationField;
