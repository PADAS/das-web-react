const evaluateDoesNotHaveInputCondition = (fieldValue) => {
  if (fieldValue === undefined) {
    return true;
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.length === 0;
  }

  if (typeof fieldValue === 'object' && fieldValue !== null) {
    return Object.keys(fieldValue).length === 0;
  }

  if (typeof fieldValue === 'string') {
    return fieldValue.length === 0;
  }

  return false;
};

export default evaluateDoesNotHaveInputCondition;
