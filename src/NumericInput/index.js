import React, { useEffect, useRef, useState } from 'react';

import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';

import styles from './styles.module.scss';

const isNumber = value => !isNaN( parseInt(value) );

const NumericInput = ({ id = 'hello', onChange, defaultValue = null }) => {

  const [value, setValue] = useState(!defaultValue ? '' : `${defaultValue}`);

  const inputRef = useRef(null);
  const caretLastPositionKnown = useRef(null);

  const handleOnKeyDown = (event) => {
    if (isNumber(event.key)){
      setValue((currentValue) => `${currentValue}${event.key}`);
    } else if (event.key === 'Backspace') {

      let newValue = '';
      const { target: { selectionStart, selectionEnd } } = event;

      if (selectionStart === selectionEnd) {
        newValue = selectionStart > 0
          ? `${ value.slice(0, selectionStart - 1) }${ value.slice(selectionEnd, value.length) }`
          : value;
      } else {
        newValue = value.slice(0, selectionStart) + value.slice(selectionEnd, value.length);
      }

      caretLastPositionKnown.current = selectionStart;
      setValue( newValue );
    }
  };


  useEffect(() => {
    if (inputRef.current && caretLastPositionKnown.current){
      const lastPosition = caretLastPositionKnown.current - 1;

      setTimeout(() => {
        inputRef.current.selectionStart = lastPosition;
        inputRef.current.selectionEnd = lastPosition;
      }, 0);
    }
  }, [value]);

  return <div className={styles.numericInput}>
    <input id={id}
             type="text"
             inputMode="numeric"
             onKeyDown={handleOnKeyDown}
             value={value}
             ref={inputRef} />

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
