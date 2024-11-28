import React from 'react';

import Section from './fields/Section';

import SchemaFormContextProvider from './SchemaFormContext';

const SchemaForm = ({ onFormChange, formData, onFormSubmit, renderSubmitButton, schema, formErrors = {}, className }) => {

  const handleOnSubmit = (e) => {
    e.preventDefault();
    onFormSubmit({ formData });
  };

  return <SchemaFormContextProvider schema={schema} formData={formData} onFormChange={onFormChange} formErrors={formErrors} >
    <form onSubmit={handleOnSubmit} className={className}>
      {
        schema?.ui?.order?.map((sectionName) => (
          <Section sectionName={sectionName} key={sectionName} />
        ))
      }
      {renderSubmitButton()}
    </form>
  </SchemaFormContextProvider>;
};

export default SchemaForm;
