import React, { useContext } from 'react';

import { SchemaFormContext } from '../../SchemaFormContext';

const ShortTextInput = ({ details, id, onChange }) => (
  <input id={id}
           value={details.value}
           type="text"
           defaultValue={details.defaultInput}
           placeholder={details.placeholder}
           onChange={onChange}
           data-testid={`schema-form-short-text-field-input-${id}`} />
);

const LongTextInput = ({ details, id, onChange }) => (
  <textarea id={id} value={details.value}
            defaultValue={details.defaultInput}
            placeholder={details.placeholder}
            onChange={onChange}
            data-testid={`schema-form-long-text-field-input-${id}`}>
  </textarea>
);

const INPUT_TYPE = {
  SHORT: 'SHORT_TEXT',
  LONG: 'LONG_TEXT'
};

const TEXT_INPUT_TYPE_TO_INPUT = {
  [INPUT_TYPE.SHORT]: ShortTextInput,
  [INPUT_TYPE.LONG]: LongTextInput,
};

/*ToDo:
* error message for i18n
* styling
* coverage
* validation for text length
* */

const Text = ({ id }) => {
  const { fields, onFieldChange } = useContext(SchemaFormContext);

  const { details } = fields[id];

  const label = details.isRequired ? `${details.label} *` : details.label;
  const TextInput = TEXT_INPUT_TYPE_TO_INPUT[details.inputType];

  const handleOnChange = (event) => onFieldChange(id, event.currentTarget.value);

  return <div data-testid={`schema-form-text-field-${id}`}>
    <label htmlFor={id}>{label}</label>
    <TextInput details={details} id={id} onChange={handleOnChange} />
    <p>{details.description}</p>
    {
      details.error && (
        <p>Error message</p> /*ToDo: add i18n error message*/
      )
    }
  </div>;
};

export default Text;
