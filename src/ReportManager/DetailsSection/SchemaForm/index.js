import React, { useMemo, useState } from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from './constants';
import makeFieldsFromSchema from './utils/makeFieldsFromSchema';

import Header from './fields/Header';
import SchemaFormContextProvider from './SchemaFormContext';
import Section from './fields/Section';
import Text from './fields/Text';

export const FIELDS = {
  [FORM_ELEMENT_TYPES.HEADER]: Header,
  [FORM_ELEMENT_TYPES.SECTION]: Section,
  [FORM_ELEMENT_TYPES.TEXT]: Text,
};

const SchemaForm = ({ formData, onFormChange, onFormSubmit, renderSubmitButton, schema }) => {
  const [formErrors, setFormErrors] = useState({});

  const fields = useMemo(() => schema ? makeFieldsFromSchema(schema) : {}, [schema]);

  const handleOnSubmit = (event) => {
    event.preventDefault();

    // TODO: Get the form errors from AJV compiling the JSON schema and validating the data.
    const newFormErrors = {};
    setFormErrors(newFormErrors);

    if (Object.keys(newFormErrors).length === 0) {
      onFormSubmit({ formData });
    }
  };

  const renderField = (fieldId) => {
    const { type } = fields[fieldId];

    const Field = FIELDS[type];

    return <Field id={fieldId} key={fieldId} renderField={renderField} />;
  };

  return <SchemaFormContextProvider fields={fields} formErrors={formErrors} onFormChange={onFormChange}>
    <form onSubmit={handleOnSubmit}>
      {fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <Section
        id={sectionId}
        key={sectionId}
        renderField={renderField}
      />)}

      {renderSubmitButton()}
    </form>
  </SchemaFormContextProvider>;
};

export default SchemaForm;
