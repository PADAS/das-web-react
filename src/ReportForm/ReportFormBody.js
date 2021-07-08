import React, { memo, forwardRef, useCallback } from 'react';
import Form from 'react-jsonschema-form-bs4';
import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import { ObjectFieldTemplate } from '../SchemaFields';

import styles from './styles.module.scss';

const additionalMetaSchemas = [draft4JsonSchema];

const filterOutEnumErrors = (errors, schema) => errors // filter out enum-based errors, as it's a type conflict between the property having type='string' when our API returns strings but expecting objects in the POSTs.
  .filter((error) => {
    const linearErrorPropTree = error.property
      .replace(/'|\.properties|\[|\]|\.enumNames|\.enum/g, '.')
      .split('.')
      .filter(p => !!p)
      .map(item => isNaN(item) ? item : parseFloat(item));

    let match;

    if (linearErrorPropTree.length === 1) {
      match = schema.properties[linearErrorPropTree[0]];
    } else {
      match = linearErrorPropTree
        .reduce((accumulator, p) => {
          if (!isNaN(p)) {
            return accumulator.items;
          }
          return (accumulator.properties || accumulator)[p];
        }, schema);
    }

    return !!match && !match.enum;
  });

const filterOutRequiredValueOnSchemaPropErrors = errors => errors.filter(err => !JSON.stringify(err).includes('required should be array'));

const ReportFormBody = forwardRef((props, ref) => { // eslint-disable-line react/display-name
  const { formData, formScrollContainer, children, schema, uiSchema, onChange, onSubmit, ...rest } = props;

  const transformErrors = useCallback((errors) => {
    const errs = filterOutRequiredValueOnSchemaPropErrors(
      filterOutEnumErrors(errors, schema));
    console.log({ errs });
    return errs;
  }, [schema]
  );


  return <Form
    additionalMetaSchemas={additionalMetaSchemas}
    className={`${styles.form} ${schema.readonly ? styles.readonly : ''}`}
    disabled={schema.readonly}
    formData={formData}
    liveValidate={true}
    onChange={onChange}
    formContext={
      {
        scrollContainer: formScrollContainer,
      }
    }
    onSubmit={onSubmit}
    ref={ref}
    schema={schema}
    ObjectFieldTemplate={ObjectFieldTemplate}
    transformErrors={transformErrors}
    uiSchema={uiSchema}
    {...rest}
  >
    {children}
  </Form>;
});

export default memo(ReportFormBody);