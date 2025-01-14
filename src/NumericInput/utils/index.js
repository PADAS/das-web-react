export const DECIMAL_POINT_SIGN = '.';
export const DECIMAL_COMMA_SIGN = ',';


export const parseStringValueToNumber = (value) => {
  return parseFloat( value.replace(DECIMAL_COMMA_SIGN, DECIMAL_POINT_SIGN) );
};

export const isNumber = value => !isNaN( parseStringValueToNumber(value) );

export const isFloat = (value) => value.includes(DECIMAL_COMMA_SIGN) || value.includes(DECIMAL_POINT_SIGN);

export const getNumberPrecision = (value) => {
  const stringValue = value.toString();
  if (!isFloat(stringValue)){
    return 0;
  }
  const [, floatDigits] = stringValue.split('.');
  return floatDigits.length;
};

export const incrementValue = (value, min, max) => {
  if (value === ''){
    return min?.toString() ?? '0';
  }

  const numberValue = parseStringValueToNumber(value);
  const newValue = numberValue + 1;
  const precision = getNumberPrecision(numberValue);
  const newestValue = max && newValue > max ? numberValue : newValue;
  const fixedNumberWithPrecision = newestValue.toFixed(precision);
  const [firstPrioritySign, secondPrioritySign] = getDecimalSignPriority(value);

  return fixedNumberWithPrecision.replace(firstPrioritySign, secondPrioritySign);
};

export const decrementValue = (value, min) => {
  if (value === ''){
    return min?.toString() ?? '0';
  }

  const numberValue = parseStringValueToNumber(value);
  const newValue = numberValue - 1;
  const precision = getNumberPrecision(numberValue);
  const newestValue = min && newValue < min ? numberValue : newValue;
  const fixedNumberWithPrecision = newestValue.toFixed(precision);
  const [firstPrioritySign, secondPrioritySign] = getDecimalSignPriority(value);

  return fixedNumberWithPrecision.replace(firstPrioritySign, secondPrioritySign);
};

export const eraseNonNumberChars = (value) => value.replace(/[^0-9|.,]/g, '');

export const removeExtraDecimalSign = (value, decimalSign, invalidDecimalSign) => {
  const decimalSignFirstOccurrence = value.indexOf(decimalSign);
  if (decimalSignFirstOccurrence === -1){
    return value;
  }
  const sanitizedValue = value.replaceAll(invalidDecimalSign, '').replaceAll(decimalSign, '');
  const formattedNumber = sanitizedValue.slice(0, decimalSignFirstOccurrence)
      + decimalSign
      + sanitizedValue.slice(decimalSignFirstOccurrence);

  // if starts with a decimal sign add zero
  return formattedNumber.startsWith(decimalSign) ? `0${formattedNumber}` : formattedNumber;
};

export const getDecimalSignPriority = (value) => {
  const commaSignFirstOccurrence = value.indexOf(DECIMAL_COMMA_SIGN);
  const pointSignFirstOccurrence = value.indexOf(DECIMAL_POINT_SIGN);
  const firstPrioritySign = commaSignFirstOccurrence < pointSignFirstOccurrence ? DECIMAL_COMMA_SIGN : DECIMAL_POINT_SIGN;
  const secondPrioritySign = commaSignFirstOccurrence < pointSignFirstOccurrence ? DECIMAL_POINT_SIGN : DECIMAL_COMMA_SIGN;
  return [firstPrioritySign, secondPrioritySign];
};
