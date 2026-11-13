const evaluateIsNotContainedByCondition = (fieldValue, conditionValue) => {
  const conditionValueArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];

  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    return fieldValue.some((fieldItem) => !conditionValueArray.includes(fieldItem));
  }

  if (typeof fieldValue === 'object' && fieldValue !== null) {
    const fieldKeys = Object.keys(fieldValue);
    return fieldKeys.length > 0 && fieldKeys.some((fieldKey) => !conditionValueArray.includes(fieldKey));
  }

  if (typeof fieldValue === 'string') {
    return !conditionValueArray.includes(fieldValue);
  }

  return false;
};

export default evaluateIsNotContainedByCondition;
