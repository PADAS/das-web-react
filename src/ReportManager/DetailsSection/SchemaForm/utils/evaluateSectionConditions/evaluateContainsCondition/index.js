const evaluateContainsCondition = (fieldValue, conditionValue) => {
  const conditionValueArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];

  if (Array.isArray(fieldValue)) {
    return conditionValueArray.every((conditionItem) => fieldValue.includes(conditionItem));
  }

  if (typeof fieldValue === 'object' && fieldValue !== null) {
    const fieldKeys = Object.keys(fieldValue);
    return conditionValueArray.every((conditionItem) => fieldKeys.includes(conditionItem));
  }

  if (typeof fieldValue === 'string') {
    return !Array.isArray(conditionValue) && fieldValue.includes(conditionValue);
  }

  return false;
};

export default evaluateContainsCondition;
