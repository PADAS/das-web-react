import React, { memo, useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

import Checkmark from '../Checkmark';

const InlineEditable = (props) => {
  const { editing, onEsc, onClick, validationFunc, value:originalValue, onCancel, onSave, onChange, showCancel, showEditButton, ...rest } = props;
  const inputRef = useRef(null);

  const [valid, setValidationState] = useState(validationFunc(originalValue));
  const [value, setStateValue] = useState(originalValue);

  const onStartEdit = useCallback(() => {
    setStateValue(originalValue);
    setValidationState(validationFunc(value));

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current.type !== 'number') {
          inputRef.current.setSelectionRange(0, value.length);
        }
      }
    }, 80);
  }, [originalValue, validationFunc, value]);

  useEffect(onStartEdit, [editing]);



  const onInputChange = (event) => {
    const { target: { value } } = event;

    setValidationState(validationFunc(value));
    setStateValue(value);
    onChange && onChange(value);
  };

  const onChangeCancel = () => {
    onCancel && onCancel();
  };

  const save = useCallback(async (e) => {
    e.preventDefault();
    await onSave(value);
  }, [onSave, value]);


  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onEsc && onEsc();
    }
  }, [onEsc]);

  return (
    editing ?
      <form className={styles.form} onSubmit={save}>
        <input
          className={styles.input}
          ref={inputRef}
          value={value}
          type={typeof originalValue}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          {...rest}
        />
        {showCancel && <button className={styles.button} type="button" onClick={onChangeCancel}>
          <span className={styles.x}>X</span>
        </button>}
        <button className={styles.button} type="submit">
          <Checkmark partiallyChecked={false} fullyChecked={true} />
        </button>
        {!valid && <span>Invalid, yo</span>}
      </form>
      : <span onClick={onClick} className={styles.editable} {...rest}>
        {originalValue} {showEditButton && <button type="button" onClick={onClick}>Edit</button>}
      </span>
  );


};

export default memo(InlineEditable);


InlineEditable.defaultProps = {
  showEditButton: false,
  validationFunc(value) {
    return true;
  },
  showCancel: true,
};

InlineEditable.propTypes = {
  validationFunc: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  editing: PropTypes.bool.isRequired,
  showEditButton: PropTypes.bool,
  showCancel: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  onEsc: PropTypes.func,
  onSave: PropTypes.func.isRequired,
};