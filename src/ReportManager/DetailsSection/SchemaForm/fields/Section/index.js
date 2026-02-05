import React, { memo, useEffect, useRef } from 'react';

import * as styles from './styles.module.scss';

// Sections are just visual elements that are not present in the form data structure. Thus, fields contained by
// sections are in the root objects of form data and field errors.
const Section = ({
  details,
  fieldErrors,
  focusLocationMarker,
  formData,
  formElements,
  hidden,
  id,
  onFieldChange,
  onFieldErrorsChange,
  renderField,
  setDefaultFormData,
}) => {
  const previousHiddenRef = useRef(hidden);

  const onColumnFieldChange = (fieldId, value, error) => {
    onFieldChange(fieldId, value);
    onFieldErrorsChange({ ...fieldErrors, [fieldId]: error });
  };

  useEffect(() => {
    const sectionBecameVisible = previousHiddenRef.current && !hidden;
    if (details.conditions?.length > 0 && sectionBecameVisible) {
      // The section has conditions and it just became visible. Set the
      // section's default form data from the default values of the section's
      // children.
      const sectionChildrenIds = [...details.leftColumn, ...details.rightColumn];
      const defaultFormData = sectionChildrenIds.reduce((accumulator, sectionChildId) => {
        if (formElements[sectionChildId].details.defaultInput) {
          accumulator[sectionChildId] = formElements[sectionChildId].details.defaultInput;
        }
        return accumulator;
      }, {});

      setDefaultFormData(defaultFormData);
    }
  }, [details.conditions?.length, details.leftColumn, details.rightColumn, formElements, hidden, setDefaultFormData]);

  useEffect(() => {
    previousHiddenRef.current = hidden;
  }, [hidden]);

  return <div className={styles.section} data-testid={`schema-form-section-${id}`} hidden={hidden}>
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
