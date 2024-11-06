
export const textFieldDetailsFactory = ({ description, title, deprecated, default: defaultValue }, { inputType, placeholder, isRequired }) => ({
  defaultInput: defaultValue,
  description,
  inputType,
  isActive: deprecated,
  isRequired,
  label: title,
  placeholder,
  value: '',
});
