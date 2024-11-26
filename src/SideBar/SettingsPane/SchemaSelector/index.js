import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import schemas from './mockedSchemas';

import styles from './styles.module.scss';
import { setMockedJSONSchema } from '../../../ducks/schema-selector';

/* ToDo: Delete this component and its implementations once QA process is done for EFB support in das-web-react */
const SchemaSelector = () => {
  const dispatch = useDispatch();

  const mockedFormSchema = useSelector(({ view: { schemaSelector: { schema } = {} } }) => schema ?? {});

  const handleOnChange = (event) => dispatch(
    setMockedJSONSchema( schemas.find( ({ label }) => label === event.target.value) )
  );

  return <>
    <h3 className={styles.label}>
      Selection of Mocked EFB Schema
    </h3>
    <select value={mockedFormSchema.label} onChange={handleOnChange} className={styles.select}>
      <option>None</option>
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
