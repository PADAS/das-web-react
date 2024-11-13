
export const textFieldDetailsFactory = ({ description, title, deprecated, default: defaultValue }, { inputType, placeholder, isRequired }, formValue, formError) => ({
  defaultInput: defaultValue,
  description,
  inputType,
  isActive: !deprecated,
  isRequired,
  label: title,
  placeholder,
  value: formValue,
  error: formError,
});
