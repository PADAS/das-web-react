import React, { forwardRef, useState } from 'react';
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

import styles from './styles.module.scss';

const NumericInput = ({
  className = '',
  disabled = false,
  id,
  inputProps= {},
  inputClassName = '',
  max = '',
  min = '',
  onChange,
  placeholder = '',
  required = false,
  readOnly = false,
  blockOutOfRangeValues = true,
  title = '',
  value = '',
  ...otherProps
},
ref) => {
  const [numberConfig, setNumberConfig] = useState({
    amountOfZeros: 0,
    amountOfZerosAfterLastPositiveNumber: 0,
    decimalSymbol: null,
    endsWithZero: false,
    isNegative: false,
    isPlainDecimal: false
  });

  const { t } = useTranslation('components', { keyPrefix: 'numericInput' });

  let stringifiedNumber = parseAndLocalizeNumber(value, numberConfig);

  const handleOnValueChange = (newValue) => {
    onChange(
      isNumber(newValue)
        ? parseStringValueToNumber(newValue)
        : null
    );
  };

  const handleOnKeyDown = (event) => {
    switch (event.key){
    case 'ArrowUp':
      event.preventDefault();
      handleOnValueChange( incrementValue(stringifiedNumber, min, max) );
      break;
    case 'ArrowDown':
      event.preventDefault();
      handleOnValueChange( decrementValue(stringifiedNumber, min) );
      break;
    default:
      break;
    }
  };

  const handleOnBlur = () => {
    if (numberConfig.decimalSymbol && stringifiedNumber.endsWith(numberConfig.decimalSymbol)){
      handleOnValueChange(stringifiedNumber.slice(0, -1));
      setNumberConfig({
        ...numberConfig,
        decimalSymbol: null
      });
    }
  };

  const handleOnChange = ({ currentTarget: { value: eventValue } }) => {
    const validInput = sanitizeNegativeSymbols(
      sanitizeDecimalSymbols(
        eraseNonNumericValidChars(eventValue)
      )
    );

    if ( blockOutOfRangeValues && ( max && parseFloat(validInput) > max ) ) {
      return;
    }

    const decimalDigits = getFloatDigits(validInput) ?? '';
    const decimalsArray = decimalDigits.split('');
    const areAllZeros = decimalsArray.length > 0 && decimalsArray.every((decimal) => {
      return decimal === '0';
    });
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


  return <div className={`${styles.numericInput} ${className}`} role='group' {...otherProps}>
    <input id={id}
           className={inputClassName}
           type="text"
           inputMode="numeric"
           onKeyDown={handleOnKeyDown}
           onChange={handleOnChange}
           onBlur={handleOnBlur}
           value={stringifiedNumber}
           disabled={disabled}
           readOnly={readOnly}
           placeholder={placeholder}
           required={required}
           aria-label={t('numericInputLabel')}
           {...inputProps}
           ref={ref}
           title={title} />
    {
      !readOnly && (
      <div className={styles.controls}>
        <button disabled={disabled}
                onClick={() => handleOnValueChange( incrementValue(stringifiedNumber, min, max) )}
                type='button'
                aria-label={t('incrementValueNumericInputButtonLabel')}
                aria-controls={id}>
          <ArrowUpSimpleIcon />
        </button>
        <button disabled={disabled}
                onClick={() => handleOnValueChange( decrementValue(stringifiedNumber, min) )}
                type='button'
                aria-label={t('decrementValueNumericInputButtonLabel')}
                aria-controls={id}>
          <ArrowDownSimpleIcon />
        </button>
      </div>
        )
    }
  </div>;
};

const NumericInputWithRef = forwardRef(NumericInput);

export default NumericInputWithRef;
