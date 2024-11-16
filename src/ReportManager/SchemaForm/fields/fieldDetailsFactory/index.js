
export const textFieldDetailsFactory = (jsonSchema, uiSchema, value, error) => ({
  defaultInput: jsonSchema.default,
  description: jsonSchema.description,
  inputType: uiSchema.inputType,
  isActive: !jsonSchema.deprecated,
  isRequired: uiSchema.isRequired,
  label: jsonSchema.title,
  placeholder: uiSchema.placeholder,
  value,
  error,
});
