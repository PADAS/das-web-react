import React, { useContext } from 'react';

import { FormSchemaContext } from '../../FormSchemaContext';

const Text = ({ ui, json, name }) => {

  const { onFieldChange } = useContext(FormSchemaContext);
  const { description, title, deprecated, default: defaultValue } = json;
  const { inputType, placeholder } = ui;

  const handleOnChange = (e) => onFieldChange(name, e.currentTarget.value);

  return <div>
    <label htmlFor={name}>{title}</label>
    <input id={name} type="text" defaultValue={defaultValue} placeholder={placeholder} onChange={handleOnChange}/>
    <p>{description}</p>
  </div>;
};

export default Text;
