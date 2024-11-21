import React from 'react';
import schemas from './mockedSchemas';

import styles from './styles.module.scss';

/* ToDo: Delete this component and its implementations once QA process is done for EFB support in das-web-react */
const SchemaSelector = ({ onChange }) => {

  const handleOnChange = (event) => {
    const selectedLabel = event.target.value;
    onChange( schemas.find( ({ label }) => label === selectedLabel)?.schema );
  };

  return <>
    <label htmlFor="schemaSelector" className={styles.label}>
      Schema Selection
    </label>
    <select defaultValue={null} onChange={handleOnChange} className={styles.select}>
      <option value={null}>None</option>
      {
        schemas.map((schemaItem) =>
          <option value={schemaItem.label} key={schemaItem.label}>
            {schemaItem.label}
          </option>
        )
      }
    </select>
  </>;
};

export default SchemaSelector;
