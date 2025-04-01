import React, { memo, useEffect, useCallback, useRef, useState } from 'react';

import Checkmark from '../Checkmark';

import * as styles from './styles.module.scss';

const InlineEditable = ({
  editing,
  onCancel,
  onChange,
  onClick,
  onEsc,
  onSave,
  showCancel = true,
  value: originalValue,
  ...restProps
}) => {
  const inputRef = useRef(null);

  const [value, setStateValue] = useState(originalValue);

  const onInputChange = (event) => {
    setStateValue(event.target.value);
    onChange(event.target.value);
  };

  const save = useCallback(async (event) => {
    event.preventDefault();

    await onSave(value);
  }, [onSave, value]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      onEsc();
    }
  }, [onEsc]);

  useEffect(() => {
    setStateValue(originalValue);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current.type !== 'number') {
          inputRef.current.setSelectionRange(0, value.length);
        }
      }
    }, 80);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  return editing
    ? <form className={styles.form} onSubmit={save}>
      <input
        className={styles.input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        type={typeof originalValue}
        value={value}
        {...restProps}
      />

      {showCancel && <button className={styles.button} onClick={() => onCancel()} type="button">
        <span className={styles.x}>X</span>
      </button>}

      <button className={styles.button} type="submit">
        <Checkmark fullyChecked partiallyChecked={false} />
      </button>
    </form>
    : <span className={styles.editable} onClick={onClick} {...restProps}>{originalValue}</span>;
};

export default memo(InlineEditable);
