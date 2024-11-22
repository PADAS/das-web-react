import React, { useContext } from 'react';

import { SchemaFormContext } from '../../SchemaFormContext';

import styles from './styles.module.scss';

const Section = ({ id, renderField }) => {
  const { fields } = useContext(SchemaFormContext);

  const { details } = fields[id];

  return <div className={styles.section}>
    {details.label && <h3 className={styles.header}>{details.label}</h3>}

    <div className={styles.columns}>
      <div className={details.columns === 1 ? styles.fullWidthColumn : styles.halfWidthColumn}>
        {details.leftColumn.map((fieldId) => renderField(fieldId))}
      </div>

      {details.columns === 2 && <div className={styles.halfWidthColumn}>
        {details.rightColumn.map((fieldId) => renderField(fieldId))}
      </div>}
    </div>
  </div>;
};

export default Section;
