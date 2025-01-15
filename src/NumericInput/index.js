import React, { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import {
  DECIMAL_COMMA_SYMBOL, DECIMAL_POINT_SYMBOL,
  decrementValue,
  eraseNonNumericValidChars,
  getDecimalSymbolOccurrences,
  incrementValue,
  isNumber,
  parseAndLocalizeNumber,
  parseStringValueToNumber,
  sanitizeExtraDecimalSymbols
} from './utils';

import styles from './styles.module.scss';

const NumericInput = ({
  id,
  value: formSchemaValue = '',
  onChange,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder,
  inputAriaProps,
  min = '',
  max = '',
  inputClassName = '',
  ...otherProps
},
ref) => {

  const [decimalSymbol, setDecimalSymbol] = useState(null);
  const { t } = useTranslation('components', { keyPrefix: 'numericInput' });

  let value = parseAndLocalizeNumber(formSchemaValue, decimalSymbol);

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
      handleOnValueChange( incrementValue(value, min, max) );
      break;
    case 'ArrowDown':
      event.preventDefault();
      handleOnValueChange( decrementValue(value, min) );
      break;
    default:
      break;
    }
  };

  const handleOnBlur = () => {
    if (decimalSymbol && value.endsWith(decimalSymbol)){
      handleOnValueChange(value.slice(0, -1));
      setDecimalSymbol(null);
    }
  };

  const handleOnChange = ({ currentTarget: { value: eventValue } }) => {
    const newValue = eraseNonNumericValidChars(eventValue);
    const filteredValue = sanitizeExtraDecimalSymbols(newValue);

    setDecimalSymbol(
      filteredValue.includes(DECIMAL_COMMA_SYMBOL) || filteredValue.includes(DECIMAL_POINT_SYMBOL)
        ? getDecimalSymbolOccurrences(filteredValue)[0]
        : null
    );

    if ( (min && parseFloat(filteredValue) < min) || (max && parseFloat(filteredValue) > max) ) {
      return;
    }

    handleOnValueChange(filteredValue);
  };


  return <div className={styles.numericInput} role='group' {...otherProps}>
    <input id={id}
           className={inputClassName}
           type="text"
           inputMode="numeric"
           onKeyDown={handleOnKeyDown}
           onChange={handleOnChange}
           onBlur={handleOnBlur}
           value={value}
           disabled={disabled}
           readOnly={readOnly}
           placeholder={placeholder}
           aria-label={t('numericInputLabel')}
           {...inputAriaProps}
           ref={ref} />
    {
      !readOnly && (
      <div className={styles.controls}>
        <button disabled={disabled}
                onClick={() => handleOnValueChange( incrementValue(value, min, max) )}
                type='button'
                aria-label={t('incrementValueNumericInputButtonLabel')}
                aria-controls={id}>
          <ArrowUpSimpleIcon />
        </button>
        <button disabled={disabled}
                onClick={() => handleOnValueChange( decrementValue(value, min) )}
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
