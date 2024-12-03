import React, { useCallback, useMemo, useState } from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from './constants';
import makeFieldsFromSchema from './utils/makeFieldsFromSchema';
import useSchemaValidations from './utils/useSchemaValidations';

import Header from './fields/Header';
import SchemaFormContext from './SchemaFormContext';
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

  const fieldValues = useMemo(() => Object.entries(formData).reduce((accumulator, [fieldId, fieldValue]) => {
    // TODO: Collections will require recusivity here.

    return { ...accumulator, [fieldId]: fieldValue };
  }, {}), [formData]);

  const onFieldChange = useCallback((fieldId, value) => {
    // TODO: Collections will require recusivity here.
    // If the value is empty, set it as undefined so AJV validation returns errors for required fields.
    const newFormData = { ...formData, [fieldId]: value || undefined };

    onFormDataChange(newFormData);
    setFieldErrors((fieldErrors) => ({ ...fieldErrors, [fieldId]: undefined }));
  }, [formData, onFormDataChange]);

  const onSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = runValidations(formData);
    if (fieldErrors) {
      setFieldErrors(fieldErrors);
      document.getElementById(Object.keys(fieldErrors)[0]).focus();
    } else {
      onFormSubmit({ formData });
    }
  };

  const renderField = (fieldId) => {
    const { type } = fields[fieldId];

    const Field = FIELDS[type];

    return <Field id={fieldId} key={fieldId} renderField={renderField} />;
  };

  return <SchemaFormContext.Provider value={{ fields, fieldErrors, fieldValues, onFieldChange }}>
    <form onSubmit={onSubmit}>
      {fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <Section
        id={sectionId}
        key={sectionId}
        renderField={renderField}
      />)}

      {renderSubmitButton()}
    </form>
  </SchemaFormContext.Provider>;
};

export default SchemaForm;
