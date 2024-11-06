
export const textFieldDetailsFactory = ({ description, title, deprecated, default: defaultValue }, { inputType, placeholder, isRequired }, formValue) => ({
  defaultInput: defaultValue,
  description,
  inputType,
  isActive: deprecated,
  isRequired,
  label: title,
  placeholder,
  value: formValue,
});
