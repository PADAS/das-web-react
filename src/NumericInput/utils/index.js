export const DECIMAL_POINT_SYMBOL = '.';
export const DECIMAL_COMMA_SYMBOL = ',';
export const NEGATIVE_SYMBOL = '-';


export const parseStringValueToNumber = (value) => {
  return parseFloat( value.replace(DECIMAL_COMMA_SYMBOL, DECIMAL_POINT_SYMBOL) );
};

export const isNumber = value => !isNaN( parseStringValueToNumber(value) );

export const isFloat = (value) => value.includes(DECIMAL_COMMA_SYMBOL) || value.includes(DECIMAL_POINT_SYMBOL);

export const getDecimalSymbolOccurrences = (value) => {
  const commaSymbolFirstOccurrence = value.indexOf(DECIMAL_COMMA_SYMBOL);
  const pointSymbolFirstOccurrence = value.indexOf(DECIMAL_POINT_SYMBOL);

  const hasCommaSymbol = commaSymbolFirstOccurrence > -1;
  const hasPointSymbol = pointSymbolFirstOccurrence > -1;

  if ( (!hasCommaSymbol && !hasPointSymbol) ||  ( !hasCommaSymbol && hasPointSymbol )){
    return [DECIMAL_POINT_SYMBOL, DECIMAL_COMMA_SYMBOL];
  }

  if (hasCommaSymbol && !hasPointSymbol){
    return [DECIMAL_COMMA_SYMBOL, DECIMAL_POINT_SYMBOL];
  }

  const firstSymbolOccurrence = hasCommaSymbol && hasPointSymbol && commaSymbolFirstOccurrence < pointSymbolFirstOccurrence ? DECIMAL_COMMA_SYMBOL : DECIMAL_POINT_SYMBOL;
  const secondSymbolOccurrence = hasCommaSymbol && hasPointSymbol && commaSymbolFirstOccurrence < pointSymbolFirstOccurrence ? DECIMAL_POINT_SYMBOL : DECIMAL_COMMA_SYMBOL;

  return [firstSymbolOccurrence, secondSymbolOccurrence];
};

export const getNumberPrecision = (value) => {
  const stringValue = value.toString();
  if (!isFloat(stringValue)){
    return 0;
  }
  const [firstSymbolOccurrence] = getDecimalSymbolOccurrences(value);
  const [, floatDigits] = stringValue.split(firstSymbolOccurrence);
  return floatDigits.length;
};

export const incrementValue = (value, min, max) => {
  if (value === ''){
    return min ? min.toString() : '0';
  }

  const numberValue = parseStringValueToNumber(value);
  const newValue = numberValue + 1;
  const newestValue = max && newValue > max ? numberValue : newValue;

  const [firstSymbolOccurrence, secondSymbolOccurrence] = getDecimalSymbolOccurrences(value);
  const newStringValue = newestValue.toFixed( getNumberPrecision(value) );

  return newStringValue.replace(secondSymbolOccurrence, firstSymbolOccurrence);
};

export const decrementValue = (value, min) => {
  if (value === ''){
    return min ? min.toString() : '0';
  }

  const numberValue = parseStringValueToNumber(value);
  const newValue = numberValue - 1;
  const newestValue = min && newValue < min ? numberValue : newValue;

  const [firstSymbolOccurrence, secondSymbolOccurrence] = getDecimalSymbolOccurrences(value);
  const newStringValue = newestValue.toFixed( getNumberPrecision(value) );

  return newStringValue.replace(secondSymbolOccurrence, firstSymbolOccurrence);
};

export const eraseNonNumericValidChars = (value) => value.replace(/[^0-9|.,-]/g, '');

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

/** This method help us by avoiding the user to type more than one decimal symbol
 it also removes existing extra symbols when copying/pasting directly into the input
 it takes the first occurrence of a valid symbol as the one preferred  by the user */
export const sanitizeExtraDecimalSymbols = (value) => {
  const commaSymbolFirstOccurrence = value.indexOf(DECIMAL_COMMA_SYMBOL);
  const pointSymbolFirstOccurrence = value.indexOf(DECIMAL_POINT_SYMBOL);
  const hasCommaSymbol = commaSymbolFirstOccurrence > -1;
  const hasPointSymbol = pointSymbolFirstOccurrence > -1;

  if ( hasPointSymbol && !hasCommaSymbol){
    return removeExtraDecimalSymbol(value, DECIMAL_POINT_SYMBOL, DECIMAL_COMMA_SYMBOL);
  }

  if ( hasCommaSymbol && !hasPointSymbol){
    return removeExtraDecimalSymbol(value, DECIMAL_COMMA_SYMBOL, DECIMAL_POINT_SYMBOL);
  }

  if ( hasPointSymbol && hasCommaSymbol) {
    const [firstDecimalSymbolOccurrenceSymbol, secondDecimalSymbolOccurrence] = getDecimalSymbolOccurrences(value);
    return removeExtraDecimalSymbol(value, firstDecimalSymbolOccurrenceSymbol, secondDecimalSymbolOccurrence);
  }

  return value;
};

export const parseAndLocalizeNumber = (number, decimalSymbol, isNegative) => {
  const isInValidNumber = number === null || number === undefined || number === '';

  if (isInValidNumber && !isNegative){
    return '';
  }

  if (isInValidNumber && isNegative){
    return '-';
  }

  const unFormattedStringNumber = number?.toString();
  const isNumberFloat = isFloat(unFormattedStringNumber);

  if (!isNumberFloat && decimalSymbol === null){
    return unFormattedStringNumber;
  }

  if (!isNumberFloat && decimalSymbol){
    return `${unFormattedStringNumber}${decimalSymbol}`;
  }

  const symbolToReplace = decimalSymbol === DECIMAL_COMMA_SYMBOL ? DECIMAL_POINT_SYMBOL : DECIMAL_COMMA_SYMBOL;
  return unFormattedStringNumber.replace(symbolToReplace, decimalSymbol);
};

export const isNegativeNumber = (value) => value.startsWith(NEGATIVE_SYMBOL);

export const sanitizeNegativeSymbols = (value) => {
  const isNegative = isNegativeNumber(value);
  const newValue = value.replaceAll(NEGATIVE_SYMBOL, '');

  return isNegative ? `${NEGATIVE_SYMBOL}${newValue}` : newValue;
};

