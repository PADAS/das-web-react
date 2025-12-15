const evaluateInputIsExactlyCondition = (fieldValue, conditionValue) => {
  if (typeof fieldValue === 'number') {
    return fieldValue === conditionValue;
  }

  if (typeof fieldValue === 'string') {
    return fieldValue === conditionValue;
  }

  return false;
};

export default evaluateInputIsExactlyCondition;
