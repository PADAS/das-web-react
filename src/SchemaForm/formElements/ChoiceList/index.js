import React, { memo } from 'react';

import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../../utils/form-schemas/constants';
import useFormElementDomId from '../../utils/useFormElementDomId';

import Dropdown from './Dropdown';
import List from './List';

import * as styles from './styles.module.scss';

const INPUTS = {
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN]: Dropdown,
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST]: List
};

const ChoiceList = ({ details, error, formElementId, onFieldChange, readOnly, value = '' }) => {
  const domId = useFormElementDomId(formElementId);

  const Input = INPUTS[details.inputType];

  const hasError = !!error;

  return <div>
    {details.inputType === CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN && <label
      className={`${styles.dropdownWrapper} ${hasError ? styles.error : ''}`}
      htmlFor={domId}
    >
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>}

    <Input
      aria-describedby={`${domId}-description`}
      aria-errormessage={hasError ? `${domId}-description` : undefined}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-required={details.isRequired}
      details={details}
      id={domId}
      invalid={hasError}
      label={details.label}
      onChange={(newValue) => onFieldChange(formElementId, newValue)}
      readOnly={readOnly}
      value={value}
    />

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${domId}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(ChoiceList);
