import React from 'react';
import { useTranslation } from 'react-i18next';

import { getHumanizedValue } from '../utils';

import styles from './styles.module.scss';

const FormPreview = ({ errors, fieldIds, fields, formData }) => {
  const { i18n } = useTranslation('reports');

  const hasError = !!errors;

  return <ul className={`${styles.formPreview} ${hasError ? styles.error : ''}`}>
    {fieldIds.map((fieldId) => <div key={fieldId}>
      <p className={`${styles.summaryLabel} ${errors?.[fieldId] ? styles.error : ''}`}>
        {fields[fieldId].details.label}
      </p>

      <p className={`${styles.summaryValue} ${errors?.[fieldId] ? styles.error : ''}`}>
        {getHumanizedValue(fields[fieldId], formData[fieldId], '-', i18n.language)}
      </p>
    </div>)}
  </ul>;
};

export default FormPreview;
