import React from 'react';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import styles from './styles.module.scss';


const isNumber = value => !isNaN( parseInt(value) );

const isFloat = (value) => value.includes('.');

const parseStringValueToNumber = (value) => isFloat(value) ? parseFloat(value) : parseInt(value);

const getNumberPrecision = (value) => {
  const stringValue = value.toString();
  if (!isFloat(stringValue)){
    return 0;
  }
  const [, floatDigits] = stringValue.split('.');
  return floatDigits.length;
};

const augmentValue = (value, min, max) => {
  if (value === null){
    return min ?? 0;
  }


  const newValue = value + 1;
  const precision = getNumberPrecision(value);
  const newestValue = max && newValue > max ? value : newValue;
  const fixedValue = newestValue.toFixed(precision);

  const newValueNumber = parseStringValueToNumber(fixedValue);
  return newValueNumber;
};

const reduceValue = (value, min) => {
  if (value === null){
    return min ?? 0;
  }
  const newValue = value - 1;

  const precision = getNumberPrecision(value);
  const newestValue = min && newValue < min ? value : newValue;
  const fixedValue = newestValue.toFixed(precision);

  const newValueNumber = parseStringValueToNumber(fixedValue);

  return newValueNumber;
};


const NumericInput = ({ id, value = null, setValue, min = null, max = null, ...otherProps }) => {

  const onUpArrowClick = () => {
    const newValue = augmentValue(value, min, max);
    setValue(newValue);
  };

  const onDownArrowClick = () => setValue(reduceValue(value, min));

  const handleOnKeyDown = (event) => {
    const acceptedKeys = ['Backspace', 'ArrowRight', 'ArrowLeft', 'Shift'];
    if (
      !isNumber(event.key)
        && ( '.' !== event.key ||  !value?.toString().includes('.'))
        && !acceptedKeys.includes(event.key)
    ){
      if (event.key === 'ArrowUp'){
        onUpArrowClick();
      } else if (event.key === 'ArrowDown'){
        onDownArrowClick();
      }

      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleOnChange = (event) => {
    const validInput = event.currentTarget.value.replace(/[^0-9|.]/g, '');
    const parsedNumber = parseStringValueToNumber(validInput);

    const newValue = isNaN(parsedNumber) ? null  : parsedNumber;
    setValue( newValue );
  };

  return <div className={styles.numericInput}>
    <input id={id}
             type="text"
             inputMode="numeric"
             onKeyDown={handleOnKeyDown}
             onChange={handleOnChange}
             value={value ?? ''}
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
