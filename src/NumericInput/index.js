import React, { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import {
  DECIMAL_COMMA_SYMBOL,
  DECIMAL_POINT_SYMBOL,
  decrementValue,
  eraseNonNumericValidChars,
  getDecimalSymbolOccurrences,
  incrementValue,
  isNumber,
  parseStringValueToNumber,
  removeExtraDecimalSymbol, sanitizeExtraDecimalSymbols
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

  const handleOnChange = ({ currentTarget: { value } }) => {
    const newValue = eraseNonNumericValidChars(value);
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
