import React, { useEffect, useState } from 'react';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import styles from './styles.module.scss';


const isNumber = key => !isNaN( parseInt(key) );

const parseStringValueToNumber = (value) => {
  return isFloat(value) ? parseFloat(value) : parseInt(value);
};

const isFloat = (value) => value.includes('.');

const getNumberPrecision = (value) => {
  const stringValue = value.toString();
  if (!isFloat(stringValue)){
    return 0;
  }
  const [, floatDigits] = stringValue.split('.');
  return floatDigits.length;
};

const augmentValue = (value, min, max) => {
  if (value === ''){
    return min?.toString() ?? '0';
  }

  const numberValue = parseStringValueToNumber(value);
  const newValue = numberValue + 1;
  const precision = getNumberPrecision(numberValue);
  const newestValue = max && newValue > max ? numberValue : newValue;

  return newestValue.toFixed(precision);
};

const reduceValue = (value, min) => {
  if (value === ''){
    return min?.toString() ?? '0';
  }

  const numberValue = parseStringValueToNumber(value);
  const newValue = numberValue - 1;
  const precision = getNumberPrecision(numberValue);
  const newestValue = min && newValue < min ? numberValue : newValue;

  return newestValue.toFixed(precision);
};


const NumericInput = ({ id, value: formSchemaValue = null, setValue: setFormSchemaValue, min = null, max = null, ...otherProps }) => {

  const [value, setValue] = useState(formSchemaValue === null ? '' : formSchemaValue.toString() );

  const onUpArrowClick = () => setValue(augmentValue(value, min, max));

  const onDownArrowClick = () => setValue(reduceValue(value, min));

  const handleOnKeyDown = (event) => {
    const acceptedKeys = ['Backspace', 'ArrowRight', 'ArrowLeft', 'Shift', '.'];
    const hasPointAlready = event.key === '.' && value.split('.').length > 1;
    const notValidKey = !isNumber(event.key) && !acceptedKeys.includes(event.key);
    const shouldBlockPropagation = notValidKey || hasPointAlready;

    if (notValidKey){
      if (event.key === 'ArrowUp'){
        onUpArrowClick();
      } else if (event.key === 'ArrowDown'){
        onDownArrowClick();
      }
    }

    if (shouldBlockPropagation){
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleOnChange = ({ currentTarget: { value } }) => {
    setValue(value.replace(/[^0-9|.]/g, ''));
  };

  useEffect(() => {
    if (isNumber(value)){
      setFormSchemaValue( parseStringValueToNumber(value) );
    }
  }, [setFormSchemaValue, value]);


  return <div className={styles.numericInput}>
    <input id={id}
             type="text"
             inputMode="numeric"
             onKeyDown={handleOnKeyDown}
             onChange={handleOnChange}
             value={value}
             {...otherProps} />
    <div className={styles.controls}>
      <button onClick={onUpArrowClick} type='button'>
        <ArrowUpSimpleIcon />
      </button>
      <button onClick={onDownArrowClick} type='button'>
        <ArrowDownSimpleIcon />
      </button>
    </div>
  </div>;
};

export default NumericInput;
