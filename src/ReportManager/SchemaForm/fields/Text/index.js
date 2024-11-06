import React, { useContext } from 'react';

import { SchemaFormContext, useFieldDetails } from '../../SchemaFormContext';

const Text = ({ fieldName }) => {
  const { onFieldChange } = useContext(SchemaFormContext);
  const textFieldDetails = useFieldDetails(fieldName);

  const handleOnChange = (e) => onFieldChange(fieldName, e.currentTarget.value);

  return <div>
    <label htmlFor={fieldName}>{textFieldDetails.label}</label>
    <input id={fieldName} type="text" defaultValue={textFieldDetails.defaultInput} placeholder={textFieldDetails.placeholder} onChange={handleOnChange}/>
    <p>{textFieldDetails.description}</p>
  </div>;
};

export default Text;
