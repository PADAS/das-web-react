import React, {forwardRef} from 'react';

import SchemaFormContextProvider from './SchemaFormContext';
import Section from './fields/Section';

import styles from './styles.module.scss';

const SchemaForm = ({ schema, formData = {}, onFormSubmit, className, onChange }, ref) => {

  const handleOnSubmit = (e) => {
    e.preventDefault();
    onFormSubmit();
  };

  const onFieldChange = (field, value) => {
    onChange({
      formData: {
        [field]: value
      }
    });
  };

  return <SchemaFormContextProvider schema={schema} onFieldChange={onFieldChange} formData={formData}>
    <form onSubmit={handleOnSubmit} className={className}>
      {
        schema?.ui?.order.map((sectionName) => (
          <Section sectionName={sectionName} key={sectionName} />
        ))
      }
      <button ref={ref} type="submit" className={styles.submitButton} />
    </form>
  </SchemaFormContextProvider>;
};

const SchemaFormForwardRef = forwardRef(SchemaForm);

export default SchemaFormForwardRef;
