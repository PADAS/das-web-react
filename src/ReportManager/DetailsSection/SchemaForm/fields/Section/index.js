import React, { memo, useEffect, useRef } from 'react';

import getDefaultFormData from '../../utils/getDefaultFormData';

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
  renderFormElement,
  setDefaultFormData,
}) => {
  const previousHiddenRef = useRef(hidden);

  const onColumnFieldChange = (fieldId, value, error) => {
    onFieldChange(fieldId, value);

    const fieldName = formElements[fieldId].details.value;
    onFieldErrorsChange({ ...fieldErrors, [fieldName]: error });
  };

  useEffect(() => {
    const sectionBecameVisible = previousHiddenRef.current && !hidden;
    if (sectionBecameVisible) {
      // The section just became visible. Set the section's default form data
      // from the section's children.
      const sectionChildrenIds = [...details.leftColumn, ...details.rightColumn];
      const defaultFormData = getDefaultFormData(sectionChildrenIds, formElements);
      if (Object.keys(defaultFormData).length > 0) {
        setDefaultFormData(defaultFormData);
      }
    }
  }, [details.leftColumn, details.rightColumn, formElements, hidden, setDefaultFormData]);

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
        {details.leftColumn.map((leftColumnChildId) => {
          const leftColumnChildName = formElements[leftColumnChildId].details.value;

          return renderFormElement(
            leftColumnChildId,
            formData[leftColumnChildName],
            onColumnFieldChange,
            fieldErrors[leftColumnChildName],
            focusLocationMarker
          );
        })}
      </div>

      {details.columns === 2 && <div
        className={`${styles.column} ${styles.halfWidthRight}`}
        data-testid={`schema-form-section-${id}-right-column`}
      >
        {details.rightColumn.map((rightColumnChildId) => {
          const rightColumnChildName = formElements[rightColumnChildId].details.value;

          return renderFormElement(
            rightColumnChildId,
            formData[rightColumnChildName],
            onColumnFieldChange,
            fieldErrors[rightColumnChildName],
            focusLocationMarker
          );
        })}
      </div>}
    </div>
  </div>;
};

export default memo(Section);
