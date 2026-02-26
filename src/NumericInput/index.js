import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import {
  decrementValue,
  eraseNonNumericValidChars, getAmountOfZerosAfterLastPositiveNumber,
  getDecimalSymbolOccurrences,
  getFloatDigits,
  incrementValue,
  isFloat,
  isNegativeNumber,
  isNumber,
  parseAndLocalizeNumber,
  parseStringValueToNumber,
  sanitizeDecimalSymbols,
  sanitizeNegativeSymbols
} from './utils';

import * as styles from './styles.module.scss';

const NumericInput = ({
  className = '',
  disabled = false,
  id,
  inputProps= {},
  max = '',
  min = '',
  onChange,
  placeholder = '',
  required = false,
  readOnly = false,
  ref,
  blockOutOfRangeValues = true,
  title = '',
  value = '',
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'numericInput' });

  const [numberConfig, setNumberConfig] = useState({
    amountOfZeros: 0,
    amountOfZerosAfterLastPositiveNumber: 0,
    decimalSymbol: null,
    endsWithZero: false,
    isNegative: false,
    isPlainDecimal: false
  });

  const stringifiedNumber = parseAndLocalizeNumber(value, numberConfig);

  const handleOnValueChange = (newValue) => onChange(isNumber(newValue) ? parseStringValueToNumber(newValue) : null);

  const handleOnKeyDown = (event) => {
    switch (event.key){
    case 'ArrowUp':
      event.preventDefault();
      handleOnValueChange(incrementValue(stringifiedNumber, min, max));
      break;

    case 'ArrowDown':
      event.preventDefault();
      handleOnValueChange(decrementValue(stringifiedNumber, min));
      break;

    default:
      break;
    }
  };

  const handleOnBlur = () => {
    if (numberConfig.decimalSymbol && stringifiedNumber.endsWith(numberConfig.decimalSymbol)) {
      handleOnValueChange(stringifiedNumber.slice(0, -1));
      setNumberConfig({ ...numberConfig, decimalSymbol: null });
    }
  };

  const handleOnChange = ({ currentTarget: { value: eventValue } }) => {
    const validInput = sanitizeNegativeSymbols(sanitizeDecimalSymbols(eraseNonNumericValidChars(eventValue)));

    if (blockOutOfRangeValues && max && parseFloat(validInput) > max) {
      return;
    }

    const decimalDigits = getFloatDigits(validInput) ?? '';
    const decimalsArray = decimalDigits.split('');
    const areAllZeros = decimalsArray.length > 0 && decimalsArray.every((decimal) => decimal === '0');
    const endsWithZero = decimalDigits.endsWith('0');

    setNumberConfig({
      amountOfZeros: decimalsArray.length,
      amountOfZerosAfterLastPositiveNumber: endsWithZero ? getAmountOfZerosAfterLastPositiveNumber(decimalDigits) : 0,
      decimalSymbol: isFloat(validInput) ? getDecimalSymbolOccurrences(validInput)[0] : null,
      endsWithZero,
      isNegative: isNegativeNumber(validInput),
      isPlainDecimal: isFloat(validInput) && areAllZeros
    });

    handleOnValueChange(validInput);
  };

  return <div
      className={styles.numericInput
        + (readOnly ? ` ${styles.readOnly}` : '')
        + (disabled ? ` ${styles.disabled}` : '')
        + (inputProps['aria-invalid'] ? ` ${styles.error}` : '')
        + ` ${className}`}
      data-testid="numericInput"
      role="group"
      {...otherProps}
    >
    <input
      aria-label={t('numericInputLabel')}
      className={styles.input}
      disabled={disabled}
      id={id}
      inputMode="numeric"
      onBlur={readOnly ? undefined : handleOnBlur}
      onChange={(event) => handleOnChange(event)}
      onKeyDown={readOnly ? undefined : handleOnKeyDown}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      title={title}
      type="text"
      value={stringifiedNumber}
      {...inputProps}
      ref={ref}
    />

    <div className={styles.controls}>
      <button
        aria-controls={id}
        aria-label={t('incrementValueNumericInputButtonLabel')}
        disabled={disabled || readOnly}
        onClick={() => handleOnValueChange(incrementValue(stringifiedNumber, min, max))}
        tabIndex={-1}
        type="button"
      >
        <ArrowUpSimpleIcon />
      </button>

      <button
        aria-controls={id}
        aria-label={t('decrementValueNumericInputButtonLabel')}
        disabled={disabled || readOnly}
        onClick={() => handleOnValueChange(decrementValue(stringifiedNumber, min))}
        tabIndex={-1}
        type="button"
      >
        <ArrowDownSimpleIcon />
      </button>
    </div>
  </div>;
};

export default NumericInput;
