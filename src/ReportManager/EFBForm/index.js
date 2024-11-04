import React, { useEffect, useState } from 'react';

import FormSchemaContextProvider from './FormSchemaContext';
import Section from './fields/Section';

const EFBForm = ({ schema, formData: initialFormData = {}, isDisabled, className, onChange, onError }) => {
  const [formData, setFormData] = useState(initialFormData);

  const onSubmit = (e) => {
    e.preventDefault();
  };

  const onFieldChange = (field, value) => {
    setFormData((data) => ({
      ...data,
      [field]: value
    }));
  };

  useEffect(() => {
    onChange({
      formData
    });
  }, [formData, onChange]);

  return <FormSchemaContextProvider schema={schema} onFieldChange={onFieldChange} formData={formData}>
    <form onSubmit={onSubmit} style={{ background: 'red', padding: '4em' }}>
      {
        schema?.ui?.order.map((sectionId) => (
          <Section id={sectionId} key={sectionId} />
        ))
      }
    </form>
  </FormSchemaContextProvider>;
};

export default EFBForm;
