import React from 'react';

import List from './List';
import Dropdown from './Dropdown';

import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../constants';

import styles from './styles.module.scss';

const INPUTS = {
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN]: Dropdown,
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST]: List
};

const ChoiceList = ({ details, error, id, onFieldChange, value = '' }) => {

  const Input = INPUTS[details.inputType];
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div>
    <label className={`${styles.dropdownWrapper} ${hasError ? styles.error : ''}`}>
      {label}

      <Input
          aria-describedby={hasDescription ? `${id}-description`: ''}
          aria-invalid={hasError}
          hasError={hasError}
          id={id}
          onChange={(newValue) => {
            onFieldChange(id, newValue);
          }}
          value={value}
          details={details}
          label={label} />
    </label>

    {(hasDescription || hasError) && <p
          aria-live={hasError ? 'assertive' : 'off'}
          className={`${styles.description} ${hasError ? styles.error : ''}`}
          id={`${id}-description`}
      >
        {error?.message || details.description}
      </p>}
  </div>;
};

export default ChoiceList;
