import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

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
  const fields = useMemo(() => schema ? makeFieldsFromSchema(schema) : {}, [schema]);

  const onSubmit = (event) => {
    event.preventDefault();

    // TODO: Add form validation with AJV before submission and show errors.
    onFormSubmit({ formData });
  };

  const renderField = (fieldId) => {
    const { type } = fields[fieldId];

    const Field = FIELDS[type];

    return <Field id={fieldId} key={fieldId} renderField={renderField} />;
  };

  return <SchemaFormContextProvider fields={fields} formData={formData} onFormChange={onFormChange}>
    <form onSubmit={onSubmit}>
      {fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <Section
        id={sectionId}
        key={sectionId}
        renderField={renderField}
      />)}

      {renderSubmitButton()}
    </form>
  </SchemaFormContextProvider>;
};

SchemaForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  renderSubmitButton: PropTypes.func.isRequired,
  schema: PropTypes.object.isRequired,
};

export default SchemaForm;
