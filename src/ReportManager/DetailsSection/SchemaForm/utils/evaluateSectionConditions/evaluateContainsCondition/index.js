const evaluateContainsCondition = (fieldValue, conditionValue) => {
  if (typeof fieldValue === 'string') {
    return fieldValue.includes(conditionValue);
  }

  return false;
};

export default evaluateContainsCondition;
