import React, { useEffect, useState } from 'react';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import styles from './styles.module.scss';

const isNumber = value => !isNaN( parseInt(value) );

const NumericInput = ({ id = 'hello', onChange, defaultValue = null }) => {
  const [value, setValue] = useState(!defaultValue ? '' : `${defaultValue}`);

  const handleOnChange = (event) => {
    const validInput = event.currentTarget.value.replace(/[^0-9|.,]/g, '');
    setValue(validInput);
  };

  const handleOnKeyDown = (event) => {
    const acceptedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'];
    if (
      !isNumber(event.key)
        && ( !['.', ','].includes(event.key) || ( value.includes('.') || value.includes(',') ) )
        && !acceptedKeys.includes(event.key)
    ){
      event.preventDefault();
      event.stopPropagation();
    }
  };

  useEffect(() => {
    if (!!value){
      onChange?.( value );
    }
  }, [onChange, value]);

  return <div className={styles.numericInput}>
    <input id={id}
             type="text"
             inputMode="numeric"
             onKeyDown={handleOnKeyDown}
             onChange={handleOnChange}
             value={value} />
    <div className={styles.controls}>
      <button>
        <ArrowUpSimpleIcon />
      </button>
      <button>
        <ArrowDownSimpleIcon />
      </button>
    </div>

  </div>;
};

export default NumericInput;
