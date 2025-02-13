import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from './constants';
import makeFieldsFromSchema from './utils/makeFieldsFromSchema';
import useSchemaValidations from './utils/useSchemaValidations';

import Collection from './fields/Collection';
import ChoiceList from './fields/ChoiceList';
import DateTime from './fields/DateTime';
import Header from './fields/Header';
import Numeric from './fields/Numeric';
import Section from './fields/Section';
import Text from './fields/Text';

export const FIELDS = {
  [FORM_ELEMENT_TYPES.CHOICE_LIST]: ChoiceList,
  [FORM_ELEMENT_TYPES.DATE_TIME]: DateTime,
  [FORM_ELEMENT_TYPES.SECTION]: Section,
  [FORM_ELEMENT_TYPES.TEXT]: Text,
  [FORM_ELEMENT_TYPES.NUMERIC]: Numeric,
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

  // This ref works as a flag to trigger a useEffect and call onFormDataChange asynchronously when there are changes in
  // the form data, so we can keep the onSectionFieldChange dependency array empty.
  const shouldSendFormDataChangeRef = useRef(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState(initialFormData);

  const fields = useMemo(() => makeFieldsFromSchema(schema), [schema]);

  const onSectionFieldChange = useCallback((fieldId, value) => {
    setFormData((formData) => ({ ...formData, [fieldId]: value }));

    shouldSendFormDataChangeRef.current = true;
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = runValidations(formData);
    if (fieldErrors) {
      setFieldErrors(fieldErrors);

      // If there are validation errors we focus the first erroneous field if it is visible (it may be inside a
      // collection).
      const idOfFirstErroneousField = Object.keys(fieldErrors)[0];
      const elementWithError = document.getElementById(idOfFirstErroneousField);
      elementWithError?.scrollIntoView?.();
      elementWithError?.focus();
    } else {
      onFormSubmit();
    }
  };

  // This method is designed to render fields inside sections and collections. In order to support recursion we let the
  // parents handle the propagation of values, change callbacks, errors, breadcrumbs (only for collections), etc...
  const renderField = (id, value, onChange, error, breadcrumbs = []) => {
    switch (fields[id].type) {
    case FORM_ELEMENT_TYPES.HEADER:
      return <Header details={fields[id].details} id={id} key={id} />;

    case FORM_ELEMENT_TYPES.COLLECTION:
      return <Collection
        breadcrumbs={breadcrumbs}
        details={fields[id].details}
        error={error}
        fields={fields}
        id={id}
        key={id}
        onFieldChange={onChange}
        renderField={renderField}
        value={value}
      />;

    default:
      const Field = FIELDS[fields[id].type];
      return <Field
        autofillDefaultInput={autofillDefaultInputs}
        details={fields[id].details}
        error={error}
        id={id}
        key={id}
        onFieldChange={onChange}
        value={value}
      />;
    }
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
      fieldErrors={fieldErrors}
      formData={formData}
      id={sectionId}
      key={sectionId}
      onFieldChange={onSectionFieldChange}
      onFieldErrorsChange={(newFieldErrors) => setFieldErrors(newFieldErrors)}
      renderField={renderField}
    />)}

    {renderSubmitButton()}
  </form>;
};

export default SchemaForm;
