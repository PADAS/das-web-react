import React, { memo } from 'react';

import styles from './styles.module.scss';

// Sections are just visual elements that are not present in the form data structure. Thus, fields contained by
// sections are in the root objects of form data and field errors.
const Section = ({
  details,
  fieldErrors,
  focusLocationMarker,
  formData,
  id,
  onFieldChange,
  onFieldErrorsChange,
  renderField,
}) => {
  const onColumnFieldChange = (fieldId, value, error) => {
    onFieldChange(fieldId, value);
    onFieldErrorsChange({ ...fieldErrors, [fieldId]: error });
  };

  return <div
      className={styles.section}
      data-testid={`schema-form-section-${id}`}
    >
    {details.label && <h3 className={styles.header}>{details.label}</h3>}

    <div className={styles.columns}>
      <div
        className={`${styles.column} ${details.columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}
        data-testid={`schema-form-section-${id}-left-column`}
      >
        {details.leftColumn.map((fieldId) => renderField(
          fieldId,
          formData[fieldId],
          onColumnFieldChange,
          fieldErrors[fieldId],
          focusLocationMarker
        ))}
      </div>

      {details.columns === 2 && <div
        className={`${styles.column} ${styles.halfWidthRight}`}
        data-testid={`schema-form-section-${id}-right-column`}
      >
        {details.rightColumn.map((fieldId) => renderField(
          fieldId,
          formData[fieldId],
          onColumnFieldChange,
          fieldErrors[fieldId],
          focusLocationMarker
        ))}
      </div>}
    </div>
  </div>;
};

export default memo(Section);
