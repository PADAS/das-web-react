import React, { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import {
  decrementValue,
  eraseNonNumericValidChars,
  getDecimalSymbolOccurrences,
  getFloatDigits,
  getNumberPrecision,
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
  disabled = false,
  id,
  inputAriaProps= {},
  inputClassName = '',
  max = '',
  min = '',
  onChange,
  placeholder = '',
  required = false,
  readOnly = false,
  blockOutOfRangeValues = true,
  value = '',
  ...otherProps
},
ref) => {

  const [decimalSymbol, setDecimalSymbol] = useState(null);
  const [isNegative, setIsNegative] = useState(false);
  const [isPlainDecimal, setIsPlainDecimal] = useState(false);

  const { t } = useTranslation('components', { keyPrefix: 'numericInput' });

  let stringifiedNumber = parseAndLocalizeNumber(value, decimalSymbol, isNegative, isPlainDecimal);

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
    if (decimalSymbol && stringifiedNumber.endsWith(decimalSymbol)){
      handleOnValueChange(stringifiedNumber.slice(0, -1));
      setDecimalSymbol(null);
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

    setDecimalSymbol(isFloat(validInput) ? getDecimalSymbolOccurrences(validInput)[0] : null);
    setIsNegative(isNegativeNumber(validInput));
    setIsPlainDecimal( isFloat(validInput) && getNumberPrecision(validInput) === 1 && getFloatDigits(validInput) === '0' );

    handleOnValueChange(validInput);
  };


  return <div className={styles.numericInput} role='group' {...otherProps}>
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
           {...inputAriaProps}
           ref={ref} />
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
