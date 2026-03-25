import React, { useMemo } from 'react';
import Form from '@rjsf/react-bootstrap';

import { formValidator } from '../../utils/events';

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
} from '../../SchemaFields';

import * as styles from './styles.module.scss';

// For V1 schemas, we basically hack a rjsf Form so they render all the fields for us and we styled them so they don't
// look like fields.
const V1SchemaFormSummary = ({ eventSchema, report }) => {
  const { schema, uiSchema } = eventSchema;

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

  return <Form
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
  />;
};

export default V1SchemaFormSummary;
