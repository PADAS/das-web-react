import React, { memo, forwardRef, useCallback, useState } from 'react';
import Form from 'react-jsonschema-form';
import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import styles from './styles.module.scss';

const additionalMetaSchemas = [draft4JsonSchema];

const filterOutTypeRelatedEnumErrors = (errors, schema) => errors // filter out enum-based errors, as it's a type conflict between the property having type='string' when our API returns strings but expecting objects in the POSTs.
  .filter((error) => {
    const linearErrorPropTree = error.property
      .replace(/'|\.properties|\[|\]|\.enumNames|\.enum/g, '.')
      .split('.')
      .filter(p => !!p);

    if (linearErrorPropTree.length === 1) {
      return !schema.properties[linearErrorPropTree[0]].enum;
    }
    return !linearErrorPropTree
      .reduce((accumulator, p) => (accumulator.properties || accumulator)[p], schema).enum;
  });

const ReportFormBody = forwardRef((props, ref) => { // eslint-disable-line react/display-name
  const { formData, children, schema, uiSchema, onChange, onSubmit, ...rest } = props;

  const transformErrors = useCallback((errors) =>
    filterOutTypeRelatedEnumErrors(errors, schema), [schema]
  );


  return <Form
    additionalMetaSchemas={additionalMetaSchemas}
    className={styles.form}
    disabled={schema.readonly}
    formData={formData}
    liveValidate={true}
    onChange={onChange}
    onSubmit={onSubmit}
    ref={ref}
    schema={schema}
    transformErrors={transformErrors}
    uiSchema={uiSchema}
    {...rest}
  >
    {children}
  </Form>;
});

export default memo(ReportFormBody);