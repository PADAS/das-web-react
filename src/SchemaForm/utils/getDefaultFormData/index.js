const getDefaultFormData = (fieldIds, formElements) => fieldIds.reduce((accumulator, fieldId) => {
  const fieldDefaultInput = formElements[fieldId].details.defaultInput;
  const doesFieldHaveDefaultInput = fieldDefaultInput || fieldDefaultInput === 0 || fieldDefaultInput === false;
  if (doesFieldHaveDefaultInput) {
    const fieldName = formElements[fieldId].details.value;
    accumulator[fieldName] = fieldDefaultInput;
  }
  return accumulator;
}, {});

export default getDefaultFormData;
