export const DECIMAL_POINT_SYMBOL = '.';
export const DECIMAL_COMMA_SYMBOL = ',';


export const parseStringValueToNumber = (value) => {
  return parseFloat( value.replace(DECIMAL_COMMA_SYMBOL, DECIMAL_POINT_SYMBOL) );
};

export const isNumber = value => !isNaN( parseStringValueToNumber(value) );

export const isFloat = (value) => value.includes(DECIMAL_COMMA_SYMBOL) || value.includes(DECIMAL_POINT_SYMBOL);

export const getDecimalSymbolOccurrences = (value) => {
  const commaSymbolFirstOccurrence = value.indexOf(DECIMAL_COMMA_SYMBOL);
  const pointSymbolFirstOccurrence = value.indexOf(DECIMAL_POINT_SYMBOL);
  const firstOccurrenceSymbol = commaSymbolFirstOccurrence < pointSymbolFirstOccurrence ? DECIMAL_COMMA_SYMBOL : DECIMAL_POINT_SYMBOL;
  const secondOccurrenceSymbol = commaSymbolFirstOccurrence < pointSymbolFirstOccurrence ? DECIMAL_POINT_SYMBOL : DECIMAL_COMMA_SYMBOL;
  return [firstOccurrenceSymbol, secondOccurrenceSymbol];
};

export const getNumberPrecision = (value) => {
  const stringValue = value.toString();
  if (!isFloat(stringValue)){
    return 0;
  }
  const [firstOccurrenceSymbol] = getDecimalSymbolOccurrences(value);
  const [, floatDigits] = stringValue.split(firstOccurrenceSymbol);
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
  const [firstOccurrenceSymbol, secondOccurrenceSymbol] = getDecimalSymbolOccurrences(value);

  return fixedNumberWithPrecision.replace(firstOccurrenceSymbol, secondOccurrenceSymbol);
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
  const [firstOccurrenceDecimalSymbol, secondOccurrenceDecimalSymbol] = getDecimalSymbolOccurrences(value);

  return fixedNumberWithPrecision.replace(firstOccurrenceDecimalSymbol, secondOccurrenceDecimalSymbol);
};

export const eraseNonValidChars = (value) => value.replace(/[^0-9|.,]/g, '');

export const removeExtraDecimalSymbol = (value, decimalSymbol, invalidDecimalSymbol) => {
  const decimalSymbolFirstOccurrence = value.indexOf(decimalSymbol);
  if (decimalSymbolFirstOccurrence === -1){
    return value;
  }
  const sanitizedValue = value.replaceAll(invalidDecimalSymbol, '').replaceAll(decimalSymbol, '');
  const formattedNumber = sanitizedValue.slice(0, decimalSymbolFirstOccurrence)
      + decimalSymbol
      + sanitizedValue.slice(decimalSymbolFirstOccurrence);

  // if starts with a decimal symbol add zero
  return formattedNumber.startsWith(decimalSymbol) ? `0${formattedNumber}` : formattedNumber;
};

