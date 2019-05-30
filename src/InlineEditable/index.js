import React, { memo, useRef, useState, Fragment } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

import Checkmark from '../Checkmark';

const InlineEditable = memo((props) => {
  const { validationFunc, value:originalValue, onSave } = props;
  const inputRef = useRef(null);
  const [editing, setEditState] = useState(false);
  const [valid, setValidationState] = useState(validationFunc(originalValue));
  const [value, setStateValue] = useState(originalValue);

  const onChange = (event) => {
    const { target: { value } } = event;

    setValidationState(validationFunc(value));
    setStateValue(value);
  }

  const onStartEdit = () => {
    setEditState(true);
    setValidationState(validationFunc(value));

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, value.length);
      }
    });
  }

  const handleKeyDown = ({ key, stopPropagation }) => {
    if (key === 'Escape') {
      stopPropagation();
      return setEditState(false);
    }
    if (key === 'Enter') {
      return save();
    }
  };

  const save = async () => {
    await onSave(value);
    setEditState(false);
  };

  return (
    editing ?
      <Fragment>
        <input
          className={styles.input}
          ref={inputRef}
          value={value}
          type={typeof originalValue}
          onChange={onChange}
          onBlur={save}
          onKeyDown={handleKeyDown}
        />
        <button type="button" onClick={() => setEditState(false)}>X</button>
        <button type="button" onClick={save}><Checkmark fullyChecked={true} /></button>
        {!valid && <span>Invalid, yo</span>}
      </Fragment>
      : <span onClick={onStartEdit} styles={styles.editable}>
        {originalValue} <button type="button" onClick={onStartEdit}>Edit</button>
      </span>
  )


});

export default InlineEditable;


InlineEditable.defaultProps = {
  validationFunc(value) {
    return true;
  }
}

InlineEditable.propTypes = {
  validationFunc: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onSave: PropTypes.func.isRequired,
};