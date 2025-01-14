import React, { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import {
  DECIMAL_COMMA_SYMBOL,
  DECIMAL_POINT_SYMBOL,
  decrementValue,
  eraseNonValidChars,
  getDecimalSymbolOccurrences,
  incrementValue,
  isNumber,
  parseStringValueToNumber,
  removeExtraDecimalSymbol
} from './utils';

import styles from './styles.module.scss';

const NumericInput = ({
  id,
  value: formSchemaValue = '',
  onChange,
  required = false,
  disabled = false,
  readOnly = false,
  min = null,
  max = null,
  inputClassName = '',
  ...otherProps
},
ref) => {

  const { t } = useTranslation('components', { keyPrefix: 'numericInput' });
  const [value, setValue] = useState( `${formSchemaValue}` );

  const handleOnKeyDown = (event) => {
    switch (event.key){
    case 'ArrowUp':
      event.preventDefault();
      setValue( incrementValue(value, min, max) );
      break;
    case 'ArrowDown':
      event.preventDefault();
      setValue( decrementValue(value, min) );
      break;
    default:
      break;
    }
  };

  /** This method help us by avoiding the user to type more than one decimal symbol
  it also removes existing extra symbols when copying/pasting directly into the input
  it takes the first occurrence of a valid symbol as the one preferred  by the user */
  const sanitizeExtraDecimalSymbols = (value) => {
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
      const [firstOccurrenceDecimalSymbol, secondOccurrenceDecimalSymbol] = getDecimalSymbolOccurrences(value);
      return removeExtraDecimalSymbol(value, firstOccurrenceDecimalSymbol, secondOccurrenceDecimalSymbol);
    }

    return value;
  };

  const handleOnChange = ({ currentTarget: { value } }) => {
    const newValue = eraseNonValidChars(value);
    const filteredValue = sanitizeExtraDecimalSymbols(newValue);

    // ToDo: validate max and min
    if ( min && parseFloat(filteredValue) < min ) {
      // ToDo: define behavior
      console.log(filteredValue, ' is lower than min: ', min);
      return;
    }

    if ( max && parseFloat(filteredValue) > max ) {
      // ToDo: define behavior
      console.log(filteredValue, ' is greater than max: ', max);
      return;
    }

    setValue(filteredValue);
  };

  useEffect(() => {
    if (value !== ''){
      onChange(
        isNumber(value)
          ? parseStringValueToNumber(value)
          : null
      );
    }
  }, [value]);


  return <div className={styles.numericInput}>
    <input id={id}
           className={inputClassName}
           type="text"
           inputMode="numeric"
           onKeyDown={handleOnKeyDown}
           onChange={handleOnChange}
           value={value}
           disabled={disabled}
           readOnly={readOnly}
           aria-label={t('numericInputLabel')}
           ref={ref}
           {...otherProps} />
    {
      !readOnly && (
      <div className={styles.controls}>
        <button disabled={disabled}
                onClick={() => setValue( incrementValue(value, min, max) )}
                type='button'
                aria-label={t('incrementValueNumericInputButton')}
                aria-controls={id}>
          <ArrowUpSimpleIcon />
        </button>
        <button disabled={disabled}
                onClick={() => setValue( decrementValue(value, min) )}
                type='button'
                aria-label={t('decrementValueNumericInputButton')}
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
