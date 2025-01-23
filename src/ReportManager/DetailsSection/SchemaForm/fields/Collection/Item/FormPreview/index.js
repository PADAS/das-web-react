import React from 'react';
import { useTranslation } from 'react-i18next';

import { getHumanizedValue } from '../utils';

import styles from './styles.module.scss';

const FormPreview = ({ errors, fieldIds, fields, formData }) => {
  const { t, i18n } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.item.formPreview',
  });

  const hasError = !!errors;

  return <ul
      className={`${styles.formPreview} ${hasError ? styles.error : ''}`}
      data-testid="schema-form-collection-item-form-preview"
    >
    {fieldIds.map((fieldId) => <div key={fieldId}>
      <p className={`${styles.summaryLabel} ${errors?.[fieldId] ? styles.error : ''}`}>
        {fields[fieldId].details.label}
      </p>

      <p className={`${styles.summaryValue} ${errors?.[fieldId] ? styles.error : ''}`}>
        {getHumanizedValue(fields[fieldId], formData[fieldId], '-', i18n.language, t)}
      </p>
    </div>)}
  </ul>;
};

export default FormPreview;
