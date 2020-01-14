import React, { memo, forwardRef } from 'react';
import Form from 'react-jsonschema-form';
import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import styles from './styles.module.scss';

const additionalMetaSchemas = [draft4JsonSchema];

const ReportFormBody = forwardRef((props, ref) => { // eslint-disable-line react/display-name
  const { formData, children, schema, uiSchema, onChange, onSubmit, ...rest } = props;
  return <Form
    additionalMetaSchemas={additionalMetaSchemas}
    className={styles.form}
    disabled={schema.readonly}
    formData={formData}
    onChange={onChange}
    onSubmit={onSubmit}
    ref={ref}
    schema={schema}
    uiSchema={uiSchema}
    {...rest}
  >
    {children}
  </Form>;
});

export default memo(ReportFormBody);