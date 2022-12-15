import React, { memo, forwardRef, useCallback } from 'react';
import { customizeValidator } from '@rjsf/validator-ajv6';
import Form from '@rjsf/bootstrap-4';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';

import { getLinearErrorPropTree, filterOutRequiredValueOnSchemaPropErrors, filterOutErrorsForHiddenProperties } from '../utils/event-schemas';

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

const jsonFormValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

const ReportFormBody = forwardRef((props, ref) => { // eslint-disable-line react/display-name
  const { formData, formScrollContainer, children, schema, uiSchema, onChange, onError, onSubmit, ...rest } = props;

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
      className={styles.form}
      disabled={schema.readonly}
      fields={{ externalLink: ExternalLinkField }}
      formContext={{ scrollContainer: formScrollContainer }}
      formData={formData}
      noHtml5Validate
      onChange={onChange}
      onError={onError}
      onSubmit={onSubmit}
      ref={ref}
      schema={schema}
      showErrorList={false}
      templates={{
        ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        BaseInputTemplate,
        ButtonTemplates: { AddButton, MoveDownButton, MoveUpButton, RemoveButton },
        ObjectFieldTemplate,
      }}
      transformErrors={transformErrors}
      uiSchema={uiSchema}
      validator={jsonFormValidator}
      {...rest}
    >
    {children}
  </Form>;
});

export default memo(ReportFormBody);