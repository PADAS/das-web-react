import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import Form from "react-jsonschema-form";

import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import styles from './styles.module.scss';

const ReportForm = memo((props) => {
  const { formData, schema, uiSchema, ...rest } = props;

  if (!schema) return null;

  const formRef = useRef(null);

  return <Form
    additionalMetaSchemas={[draft4JsonSchema]}
    className={styles.form}
    formData={formData}
    ref={formRef}
    schema={schema}
    uiSchema={uiSchema}
    {...rest}
  />;

});


export default ReportForm;

ReportForm.defaultProps = {
  formData: {},
  uiSchema: {},
};

ReportForm.propTypes = {
  formData: PropTypes.object,
  schema: PropTypes.object.isRequired,
  uiSchema: PropTypes.object,
};