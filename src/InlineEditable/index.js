import React, { memo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

import Checkmark from '../Checkmark';

const InlineEditable = memo((props) => {
  const { validationFunc, value:originalValue, onSave, showEditButton } = props;
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

  const handleKeyDown = (event) => {
    const { key, stopPropagation, preventDefault } = event;
    if (key === 'Escape') {
      preventDefault();
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
      <form className={styles.form} onSubmit={save} onKeyDown={handleKeyDown}>
        <input
          className={styles.input}
          ref={inputRef}
          value={value}
          type={typeof originalValue}
          onChange={onChange}
        />
        <button className={styles.button} type="button" onClick={() => setEditState(false)}>
          <span className={styles.x}>X</span>
        </button>
        <button className={styles.button} type="submit">
          <Checkmark partiallyChecked={false} fullyChecked={true} />
        </button>
        {!valid && <span>Invalid, yo</span>}
      </form>
      : <span onClick={onStartEdit} className={styles.editable}>
        {originalValue} {showEditButton && <button type="button" onClick={onStartEdit}>Edit</button>}
      </span>
  )


});

export default InlineEditable;


InlineEditable.defaultProps = {
  showEditButton: false,
  validationFunc(value) {
    return true;
  },
}

InlineEditable.propTypes = {
  validationFunc: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  showEditButton: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
};