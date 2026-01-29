const evaluateInputIsExactlyCondition = (fieldValue, conditionValue) => {
  const conditionValueArray = Array.isArray(conditionValue) ? conditionValue : [conditionValue];

  if (Array.isArray(fieldValue)) {
    return fieldValue.length === conditionValueArray.length
      && fieldValue.every((fieldItem) => conditionValueArray.includes(fieldItem))
      && conditionValueArray.every((conditionItem) => fieldValue.includes(conditionItem));
  }

  if (typeof fieldValue === 'boolean') {
    return (conditionValue === 'true' && fieldValue === true) || (conditionValue === 'false' && fieldValue === false);
  }

  if (typeof fieldValue === 'number') {
    const valueParsedAsNumber = Number(conditionValue);
    return !Array.isArray(conditionValue) && !Number.isNaN(valueParsedAsNumber) && fieldValue === valueParsedAsNumber;
  }

  if (typeof fieldValue === 'object' && fieldValue !== null) {
    const fieldKeys = Object.keys(fieldValue);
    return fieldKeys.length === conditionValueArray.length
      && fieldKeys.every((fieldKey) => conditionValueArray.includes(fieldKey));
  }

  if (typeof fieldValue === 'string') {
    return !Array.isArray(conditionValue) && fieldValue === conditionValue;
  }

  return false;
};

export default evaluateInputIsExactlyCondition;
