import React, { memo, forwardRef, useCallback } from 'react';
import Form from 'react-jsonschema-form-bs4';
import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import { ObjectFieldTemplate } from '../SchemaFields';

import { getLinearErrorPropTree, filterOutRequiredValueOnSchemaPropErrors, filterOutErrorsForHiddenProperties } from '../utils/event-schemas';

import styles from './styles.module.scss';

const additionalMetaSchemas = [draft4JsonSchema];

const ReportFormBody = forwardRef((props, ref) => { // eslint-disable-line react/display-name
  const { formData, formScrollContainer, children, schema, uiSchema, onChange, onSubmit, ...rest } = props;

  const transformErrors = useCallback((errors) => {
    const errs =
    filterOutErrorsForHiddenProperties(
      filterOutRequiredValueOnSchemaPropErrors(errors)
      , uiSchema);
    return errs.map(err => ({
      ...err,
      linearProperty: getLinearErrorPropTree(err.property)
    }));
  }, [uiSchema]
  );

  return <Form
    additionalMetaSchemas={additionalMetaSchemas}
    className={styles.form}
    disabled={schema.readonly}
    formData={formData}
    onChange={onChange}
    formContext={{ scrollContainer: formScrollContainer }}
    onSubmit={onSubmit}
    ref={ref}
    schema={schema}
    ObjectFieldTemplate={ObjectFieldTemplate}
    transformErrors={transformErrors}
    uiSchema={uiSchema}
    {...rest}>
    {children}
  </Form>;
});

export default memo(ReportFormBody);