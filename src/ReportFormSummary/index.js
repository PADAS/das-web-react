import React, { memo, useMemo } from 'react';
import { customizeValidator } from '@rjsf/validator-ajv6';
import Form from '@rjsf/bootstrap-4';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import PropTypes from 'prop-types';

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

import styles from './styles.module.scss';

const formValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

const ReportFormSummary = ({ className, report, schema, uiSchema }) => {
  const { eventTypeTitle } = useReport(report);
  const filteredSchema = useMemo(() => {
    const { properties } = schema;
    const eventDetailsKeys = Object.keys(report?.event_details ?? {});
    const updatedProperties = Object.entries(properties).reduce((acc, [key, value]) => {
      return eventDetailsKeys.includes(key) ? { ...acc, [key]: value } : acc;
    }, {});
    return {
      ...schema,
      properties: updatedProperties
    };
  }, [report?.event_details, schema]);

  return <div className={`${styles.reportFormSummary} ${className}`}>
    <div className={styles.nonSchemaFields}>
      <div className={styles.nonSchemaField}>
        <label>
          Report Type
        </label>

        {eventTypeTitle}
      </div>

      {
        report.reported_by?.name &&
        <div className={styles.nonSchemaField}>
          <label>
            Reported By
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
