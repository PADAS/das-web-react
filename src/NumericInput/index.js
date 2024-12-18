import React from 'react';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import styles from './styles.module.scss';


const isNumber = value => !isNaN( parseInt(value) );

const isFloat = (value) => value.includes('.');

const parseStringValueToNumber = (value) => isFloat(value) ? parseFloat(value) : parseInt(value);

const getNumberPrecision = (value) => {
  if (!isFloat(value)){
    return 0;
  }
  const [, floatDigits] = value.split('.');
  return floatDigits.length;
};


const NumericInput = ({ id, onChange, value = '', setValue, min, max, ...otherProps }) => {

  const augmentValue = () => setValue(currentValue => {
    if (!currentValue){
      return min?.toString() ?? '0';
    }
    const valueNumber = parseStringValueToNumber(currentValue);
    const newValue = valueNumber + 1;
    return (newValue > max ? valueNumber : newValue).toFixed( getNumberPrecision(currentValue) );
  });

  const reduceValue = () => setValue(currentValue => {
    if (!currentValue){
      return min?.toString() ?? '0';
    }
    const valueNumber = parseStringValueToNumber(currentValue);
    const newValue = valueNumber - 1;
    return (newValue < min ? valueNumber : newValue).toFixed( getNumberPrecision(currentValue) );
  });

  const handleOnKeyDown = (event) => {
    const acceptedKeys = ['Backspace', 'ArrowRight', 'ArrowLeft', 'Shift'];
    if (
      !isNumber(event.key)
        && ( '.' !== event.key || value.includes('.') )
        && !acceptedKeys.includes(event.key)
    ){
      if (event.key === 'ArrowUp'){
        augmentValue();
      } else if (event.key === 'ArrowDown'){
        reduceValue();
      }

      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleOnChange = (event) => {c
    const validInput = event.currentTarget.value.replace(/[^0-9|.]/g, '');
    setValue( !!validInput ? validInput : null );
  };

  return <div className={styles.numericInput}>
    <input id={id}
             type="text"
             inputMode="numeric"
             onKeyDown={handleOnKeyDown}
             onChange={handleOnChange}
             value={value}
             {...otherProps} />
    <div className={styles.controls}>
      <button onClick={augmentValue}>
        <ArrowUpSimpleIcon />
      </button>
      <button onClick={reduceValue}>
        <ArrowDownSimpleIcon />
      </button>
    </div>
  </div>;
};

export default NumericInput;
