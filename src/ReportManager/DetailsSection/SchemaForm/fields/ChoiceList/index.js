import React, { memo } from 'react';

import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

import Dropdown from './Dropdown';
import List from './List';

import * as styles from './styles.module.scss';

const INPUTS = {
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN]: Dropdown,
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST]: List
};

const ChoiceList = ({ details, error, id, onFieldChange, readOnly, value = '' }) => {
  const Input = INPUTS[details.inputType];

  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div>
    {details.inputType === CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN && <label
      className={`${styles.dropdownWrapper} ${hasError ? styles.error : ''}`}
      htmlFor={id}
    >
      {label}
    </label>}

    <Input
      aria-describedby={hasDescription ? `${id}-description`: ''}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError}
      aria-required={details.isRequired}
      details={details}
      id={id}
      invalid={hasError}
      label={label}
      onChange={(newValue) => onFieldChange(id, newValue)}
      readOnly={readOnly}
      value={value}
    />

    {(hasDescription || hasError) && <p
      aria-live={hasError ? 'assertive' : 'off'}
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>}
  </div>;
};

export default memo(ChoiceList);
