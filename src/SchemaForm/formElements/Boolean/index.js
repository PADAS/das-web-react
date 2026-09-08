import React, { memo } from 'react';

import useFormElementDomId from '../../utils/useFormElementDomId';

import Switch from '../../../Switch';

import * as styles from './styles.module.scss';

const Boolean = ({ details, error, formElementId, onFieldChange, readOnly, value = false }) => {
  const domId = useFormElementDomId(formElementId);

  const hasError = !!error;

  return <div className={styles.boolean} data-testid={`schema-form-boolean-field-${formElementId}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={domId}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <Switch
      aria-describedby={`${domId}-description`}
      aria-errormessage={hasError ? `${domId}-description` : undefined}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-required={details.isRequired}
      checked={value}
      className={styles.switchField}
      id={domId}
      onChange={(checked) => onFieldChange(formElementId, checked)}
      readOnly={readOnly}
    />

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${domId}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Boolean);
