import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { SchemaFormContext } from '../../SchemaFormContext';

import styles from './styles.module.scss';

const Section = ({ id, renderField }) => {
  const { fields } = useContext(SchemaFormContext);

  const { details } = fields[id];

  return <div className={styles.section}>
    {details.label && <h3 className={styles.header}>{details.label}</h3>}

    <div className={styles.columns}>
      <div className={details.columns === 1 ? styles.fullWidthColumn : styles.halfWidthColumnLeft}>
        {details.leftColumn.map((fieldId) => renderField(fieldId))}
      </div>

      {details.columns === 2 && <div className={styles.halfWidthColumnRight}>
        {details.rightColumn.map((fieldId) => renderField(fieldId))}
      </div>}
    </div>
  </div>;
};

Section.propTypes = {
  id: PropTypes.string.isRequired,
  renderField: PropTypes.func.isRequired,
};

export default Section;
