import React, { memo } from 'react';

import useFormElementDomId from '../../utils/useFormElementDomId';

import NumericInput from '../../../NumericInput';

import * as styles from './styles.module.scss';

const Numeric = ({ details, error, formElementId, onFieldChange, readOnly, value = '' }) => {
  const domId = useFormElementDomId(formElementId);

  const hasError = !!error;

  return <div data-testid={`schema-form-numeric-field-${formElementId}`} className={styles.numeric}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={domId}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <NumericInput
      blockOutOfRangeValues={false}
      id={domId}
      inputProps={{
        'aria-describedby': `${domId}-description`,
        'aria-errormessage': hasError ? `${domId}-description` : undefined,
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-required': details.isRequired
      }}
      max={details.maxInput}
      min={details.minInput}
      onChange={(number) => onFieldChange(formElementId, number || number === 0 ? number : undefined)}
      placeholder={details.hint}
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

export default memo(Numeric);
