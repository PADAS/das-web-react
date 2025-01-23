import i18next from 'i18next';

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

export const getFloatDigits = (value) => {
  const [firstSymbolOccurrence] = getDecimalSymbolOccurrences(value);
  const [, floatDigits] = value.split(firstSymbolOccurrence);
  return floatDigits;
};

export const getNumberPrecision = (value) => {
  const stringValue = value.toString();
  if (!isFloat(stringValue)){
    return 0;
  }
  return getFloatDigits(value).length;
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
export const sanitizeDecimalSymbols = (value) => {
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

const getDefaultLocalizedDecimalSymbol = () => {
  return 1.1.toLocaleString(i18next.language).substring(1, 2);
};

const generateFixedZeros = (amountOfZeros) => {
  const zeros = Array.from({
    length: amountOfZeros
  }, () => '0');

  return zeros.join('');
};

export const parseAndLocalizeNumber = (number, numberConfig) => {
  const isInValidNumber = number === null || number === undefined || number === '';
  const {
    isNegative,
    decimalSymbol,
    isPlainDecimal,
    amountOfZeros,
    endsWithZero,
    amountOfZerosAfterLastPositiveNumber
  } = numberConfig;

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
    const fixedDecimals = isPlainDecimal ? generateFixedZeros(amountOfZeros) : '';
    return `${unFormattedStringNumber}${decimalSymbol}${fixedDecimals}`;
  }

  if (isNumberFloat && decimalSymbol && endsWithZero && amountOfZerosAfterLastPositiveNumber > 0 ){
    const fixedZeros = generateFixedZeros(amountOfZerosAfterLastPositiveNumber);
    const decimals = getFloatDigits(unFormattedStringNumber);
    const [integerPart] = unFormattedStringNumber.split(decimalSymbol);
    return `${integerPart}${decimalSymbol}${decimals}${fixedZeros}`;
  }

  if (isNumberFloat && decimalSymbol === null){
    return unFormattedStringNumber.replace('.', getDefaultLocalizedDecimalSymbol());
  }

  const symbolToReplace = decimalSymbol === DECIMAL_COMMA_SYMBOL ? DECIMAL_POINT_SYMBOL : DECIMAL_COMMA_SYMBOL;
  return unFormattedStringNumber.replace(symbolToReplace, decimalSymbol);
};

export const isNegativeNumber = (value) => value.startsWith(NEGATIVE_SYMBOL);

export const getAmountOfZerosAfterLastPositiveNumber = (decimalDigits) => {
  const reversedDigits = decimalDigits.split('').reverse();
  let amountOfZerosAfterLastPositiveNumber = 0;

  for (let i = 0; i < reversedDigits.length; i++) {
    const digit = reversedDigits[i];
    if (digit === '0'){
      amountOfZerosAfterLastPositiveNumber++;
    } else {
      break;
    }
  }

  return amountOfZerosAfterLastPositiveNumber;
};

export const sanitizeNegativeSymbols = (value) => {
  const isNegative = isNegativeNumber(value);
  const newValue = value.replaceAll(NEGATIVE_SYMBOL, '');

  return isNegative ? `${NEGATIVE_SYMBOL}${newValue}` : newValue;
};

