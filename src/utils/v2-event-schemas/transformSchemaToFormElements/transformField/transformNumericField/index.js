import { FORM_ELEMENT_TYPES } from '../../../constants';

const transformNumericField = (
  numericFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const numericFieldJSONSchema = jsonSchema.properties[numericFieldId];
  const numericFieldUISchema = uiSchema.fields[numericFieldId];

  // Add the numeric field node to the form elements object.
  formElements[numericFieldId] = {
    details: {
      conditionalDependents: numericFieldUISchema.conditionalDependents ?? [],
      defaultInput: numericFieldJSONSchema.default ?? '',
      description: numericFieldJSONSchema.description ?? '',
      hint: numericFieldUISchema.placeholder ?? '',
      isActive: !numericFieldJSONSchema.deprecated,
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === numericFieldId,
      ),
      label: numericFieldJSONSchema.title ?? '',
      maxInput: numericFieldJSONSchema.maximum ?? '',
      minInput: numericFieldJSONSchema.minimum ?? '',
      value: numericFieldId,
    },
    id: numericFieldId,
    isNew: false,
    isSpacer: false,
    parentId: numericFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.NUMERIC,
  };
};

export default transformNumericField;
