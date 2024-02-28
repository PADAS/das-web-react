import React, { memo, useMemo } from 'react';
import Form from '@rjsf/bootstrap-4';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import useReport from '../hooks/useReport';

import {
  AddButton,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  ExternalLinkField,
  MoveDownButton,
  MoveUpButton,
  ObjectFieldTemplate,
  RemoveButton,
} from '../SchemaFields';
import { formValidator } from '../utils/events';

import styles from './styles.module.scss';

const ReportFormSummary = ({ className, report, schema, uiSchema }) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'reportFormSummary' });
  const { eventTypeTitle } = useReport(report);
  const filteredSchema = useMemo(() => {
    const { properties = {} } = schema ?? {};
    const eventDetailsKeys = Object.keys(report?.event_details ?? {});
    return {
      ...schema,
      properties: Object.entries(properties).reduce((acc, [key, value]) => {
        return eventDetailsKeys.includes(key) ? { ...acc, [key]: value } : acc;
      }, {})
    };
  }, [report, schema]);

  return <div className={`${styles.reportFormSummary} ${className}`}>
    <div className={styles.nonSchemaFields}>
      <div className={styles.nonSchemaField}>
        <label>
          {t('reportTypeLabel')}
        </label>

        {eventTypeTitle}
      </div>

      {
        report.reported_by?.name &&
        <div className={styles.nonSchemaField}>
          <label>
            {t('reportedByLabel')}
          </label>
          {report.reported_by?.name}
        </div>
      }
    </div>

    {schema && <Form
      className={styles.form}
      disabled
      fields={{ externalLink: ExternalLinkField }}
      formData={report?.event_details}
      schema={filteredSchema}
      showErrorList={false}
      templates={{
        ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        BaseInputTemplate,
        ButtonTemplates: { AddButton, MoveDownButton, MoveUpButton, RemoveButton },
        ObjectFieldTemplate,
      }}
      uiSchema={uiSchema}
      validator={formValidator}
    />}
  </div>;
};

ReportFormSummary.propTypes = {
  className: PropTypes.string.isRequired,
  report: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
  uiSchema: PropTypes.object.isRequired,
};

export default memo(ReportFormSummary);
