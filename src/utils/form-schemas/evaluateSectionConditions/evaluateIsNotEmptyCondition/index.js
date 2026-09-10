const evaluateIsNotEmptyCondition = (fieldValue) => {
  if (fieldValue === null) {
    return false;
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.length > 0;
  }

  if (typeof fieldValue === 'boolean') {
    return true;
  }

  if (typeof fieldValue === 'number') {
    return true;
  }

  if (typeof fieldValue === 'object') {
    return Object.keys(fieldValue).length > 0;
  }

  if (typeof fieldValue === 'string') {
    return fieldValue.length > 0;
  }

  return false;
};

export default evaluateIsNotEmptyCondition;
