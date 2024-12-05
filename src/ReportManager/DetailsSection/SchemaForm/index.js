import React, { useCallback, useMemo, useState } from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from './constants';
import makeFieldsFromSchema from './utils/makeFieldsFromSchema';
import useSchemaValidations from './utils/useSchemaValidations';

import Header from './fields/Header';
import Section from './fields/Section';
import Text from './fields/Text';

export const FIELDS = {
  [FORM_ELEMENT_TYPES.HEADER]: Header,
  [FORM_ELEMENT_TYPES.SECTION]: Section,
  [FORM_ELEMENT_TYPES.TEXT]: Text,
};

const SchemaForm = ({ formData, onFormDataChange, onFormSubmit, renderSubmitButton, schema }) => {
  const runValidations = useSchemaValidations(schema);

  const [fieldErrors, setFieldErrors] = useState({});

  const fields = useMemo(() => makeFieldsFromSchema(schema), [schema]);

  // TODO: Collections will require recusivity here.
  const fieldValues = useMemo(() => Object.entries(formData).reduce((accumulator, [fieldId, fieldValue]) => ({
    ...accumulator,
    [fieldId]: fieldValue,
  }), {}), [formData]);

  const onFieldChange = useCallback((fieldId, value) => {
    // If the value is empty, set it as undefined so AJV validation returns errors for required fields.
    onFormDataChange(fieldId, value || undefined);
    setFieldErrors((fieldErrors) => ({ ...fieldErrors, [fieldId]: undefined }));
  }, [onFormDataChange]);

  const onSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = runValidations(formData);
    if (fieldErrors) {
      setFieldErrors(fieldErrors);

      const idOfFirstErroneousField = Object.keys(fieldErrors)[0];
      document.getElementById(idOfFirstErroneousField).focus();
    } else {
      onFormSubmit({ formData });
    }
  };

  const renderField = (fieldId) => {
    const { type } = fields[fieldId];

    const Field = FIELDS[type];

    if (type === FORM_ELEMENT_TYPES.HEADER) {
      return <Field details={fields[fieldId].details} id={fieldId} />;
    }
    // Collections will require a condition here to pass down renderField as prop
    return <Field
      details={fields[fieldId].details}
      error={fieldErrors[fieldId]}
      id={fieldId}
      onFieldChange={onFieldChange}
      value={fieldValues[fieldId]}
    />;
  };

  return <form onSubmit={onSubmit}>
    {fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <Section
      details={fields[sectionId].details}
      id={sectionId}
      key={sectionId}
      renderField={renderField}
    />)}

    {renderSubmitButton()}
  </form>;
};

export default SchemaForm;
