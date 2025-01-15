import {
  decrementValue,
  eraseNonNumericValidChars,
  getDecimalSymbolOccurrences,
  getNumberPrecision,
  incrementValue,
  isFloat,
  isNumber,
  parseStringValueToNumber, removeExtraDecimalSymbol, sanitizeExtraDecimalSymbols
} from './index';

describe('NumericInput - utils', () => {

  test('parse string value to number when its an integer', () => {
    expect( parseStringValueToNumber('10') ).toBe(10);
  });

  test('parse string value to number when its a decimal with comma symbol', () => {
    expect( parseStringValueToNumber('10,57') ).toBe(10.57);
  });

  test('parse string value to number when its a decimal with point symbol', () => {
    expect( parseStringValueToNumber('10.57') ).toBe(10.57);
  });

  test('checks if provided value is a number for a decimal with point symbol', () => {
    expect( isNumber('10.57') ).toBe(true);
  });

  test('checks if provided value is a number for a decimal with comma symbol', () => {
    expect( isNumber('10,57') ).toBe(true);
  });

  test('checks if provided value is a number for an integer', () => {
    expect( isNumber('10') ).toBe(true);
  });

  test('checks if provided value is a number for an negative integer', () => {
    expect( isNumber('-10') ).toBe(true);
  });

  test('checks if provided value is a number for non number string', () => {
    expect( isNumber('') ).toBe(false);
  });

  test('checks if provided value is a float number with point symbol', () => {
    expect( isFloat('10.4') ).toBe(true);
  });

  test('checks if provided value is a float number with comma symbol', () => {
    expect( isFloat('10,4') ).toBe(true);
  });

  test('checks if provided value is a float number with an integer', () => {
    expect( isFloat('10') ).toBe(false);
  });

  test('get decimal symbol first occurrence for comma float', () => {
    expect( getDecimalSymbolOccurrences('10,00') ).toStrictEqual([',', '.']);
  });

  test('get decimal symbol first occurrence for point float', () => {
    expect( getDecimalSymbolOccurrences('10.00') ).toStrictEqual(['.', ',']);
  });

  test('get decimal symbol first occurrence for point float with extra symbols', () => {
    expect( getDecimalSymbolOccurrences('10.00,00') ).toStrictEqual(['.', ',']);
  });

  test('get decimal symbol first occurrence for comma float with extra symbols', () => {
    expect( getDecimalSymbolOccurrences('10,00.00,00') ).toStrictEqual([',', '.']);
  });

  test('get number precision for integer value', () => {
    expect( getNumberPrecision('10') ).toBe(0);
  });

  test('get number precision for float value with comma symbol', () => {
    expect( getNumberPrecision('10,000') ).toBe(3);
  });

  test('get number precision for float value with point symbol', () => {
    expect( getNumberPrecision('10.00') ).toBe(2);
  });

  test('increment provided value by one', () => {
    expect( incrementValue('10') ).toBe('11');
  });

  test('increment provided value by one when value is empty and there is no min constraint', () => {
    expect( incrementValue('') ).toBe('0');
  });

  test('increment provided value by one when value is empty and there min constraint', () => {
    expect( incrementValue('', 3) ).toBe('3');
  });

  test('increment provided value by one when there is max constraint', () => {
    expect( incrementValue('10', 0, 10) ).toBe('10');
  });

  test('increment provided decimal point value by one', () => {
    expect( incrementValue('10.5') ).toBe('11.5');
  });

  test('increment provided float value by one', () => {
    expect( incrementValue('11,5') ).toBe('12,5');
  });

  test('increment provided float value by one when there is max constraint', () => {
    expect( incrementValue('11,5', null, 12) ).toBe('11,5');
  });

  test('decrement provided value by one', () => {
    expect( decrementValue('10') ).toBe('9');
  });

  test('decrement provided value by one when value is empty and there is no min constraint', () => {
    expect( decrementValue('') ).toBe('0');
  });

  test('decrement provided value by one when value is empty and there min constraint', () => {
    expect( decrementValue('', 2) ).toBe('2');
  });

  test('decrement provided value by one when there is min constraint', () => {
    expect( decrementValue('1', 1) ).toBe('1');
  });

  test('decrement provided decimal point value by one', () => {
    expect( decrementValue('10.5') ).toBe('9.5');
  });

  test('decrement provided float value by one', () => {
    expect( decrementValue('11,5') ).toBe('10,5');
  });

  test('erase invalid chars from number', () => {
    expect( eraseNonNumericValidChars('11,2dew!!/5') ).toBe('11,25');
  });

  test('remove extra decimal symbols taking first comma symbol as the valid one', () => {
    expect( removeExtraDecimalSymbol('11,2,333,44', ',', '.') ).toBe('11,233344');
  });

  test('remove extra decimal symbols taking first point symbol as the valid one', () => {
    expect( removeExtraDecimalSymbol('324.56.5.65.5', '.', ',') ).toBe('324.565655');
  });

  test('remove extra decimal symbols taking first comma symbol as the valid one replacing other decimal symbols', () => {
    expect( removeExtraDecimalSymbol('11,2,333.44.55', ',', '.') ).toBe('11,23334455');
  });

  test('remove extra decimal symbols taking first point symbol as the valid one and replacing other decimal symbols', () => {
    expect( removeExtraDecimalSymbol('324.56,5,65.5,7', '.', ',') ).toBe('324.5656557');
  });

  test('remove extra decimal symbols and adds a zero when value starts with point decimal symbol ', () => {
    expect( removeExtraDecimalSymbol('.456.323.8,9', '.', ',') ).toBe('0.45632389');
  });

  test('remove extra decimal symbols and adds a zero when value starts with comma decimal symbol ', () => {
    expect( removeExtraDecimalSymbol(',456,323.8.9', ',', '.') ).toBe('0,45632389');
  });

  test('sanitize a string value removing invalid chars and formatting based on first decimal symbol found ', () => {
    expect( sanitizeExtraDecimalSymbols('32,.,.06,.8') ).toBe('32,068');
  });

});
