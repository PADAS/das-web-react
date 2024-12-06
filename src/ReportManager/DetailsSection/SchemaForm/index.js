import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

const SchemaForm = ({
  autofillDefaultInputs,
  initialFormData,
  onFormDataChange,
  onFormSubmit,
  renderSubmitButton,
  schema,
}) => {
  const runValidations = useSchemaValidations(schema);

  const shouldSendFormDataChangeRef = useRef(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState(initialFormData);

  const fields = useMemo(() => makeFieldsFromSchema(schema), [schema]);

  // TODO: Collections will require recusivity here.
  const fieldValues = useMemo(() => Object.entries(formData).reduce((accumulator, [fieldId, fieldValue]) => ({
    ...accumulator,
    [fieldId]: fieldValue,
  }), {}), [formData]);

  const onFieldChange = useCallback((fieldId, value) => {
    // TODO: Collections will require recusivity here.
    setFormData((formData) => ({ ...formData, [fieldId]: value }));
    setFieldErrors((fieldErrors) => ({ ...fieldErrors, [fieldId]: undefined }));

    shouldSendFormDataChangeRef.current = true;
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = runValidations(formData);
    if (fieldErrors) {
      setFieldErrors(fieldErrors);

      const idOfFirstErroneousField = Object.keys(fieldErrors)[0];
      document.getElementById(idOfFirstErroneousField).focus();
    } else {
      onFormSubmit();
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
      autofillDefaultInput={autofillDefaultInputs}
      details={fields[fieldId].details}
      error={fieldErrors[fieldId]}
      id={fieldId}
      onFieldChange={onFieldChange}
      value={fieldValues[fieldId]}
    />;
  };

  useEffect(() => {
    if (shouldSendFormDataChangeRef.current) {
      onFormDataChange(formData);

      shouldSendFormDataChangeRef.current = false;
    }
  }, [formData, onFormDataChange]);

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
