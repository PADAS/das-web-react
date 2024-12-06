import React, { memo } from 'react';

import styles from './styles.module.scss';

const Section = ({ details, id, renderField }) => <div
    className={styles.section}
    data-testid={`schema-form-section-${id}`}
  >
  {details.label && <h3 className={styles.header}>{details.label}</h3>}

  <div className={styles.columns}>
    <div
      className={`${styles.column} ${details.columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}
      data-testid={`schema-form-section-${id}-left-column`}
    >
      {details.leftColumn.map((fieldId) => renderField(fieldId))}
    </div>

    {details.columns === 2 && <div
      className={`${styles.column} ${styles.halfWidthRight}`}
      data-testid={`schema-form-section-${id}-right-column`}
    >
      {details.rightColumn.map((fieldId) => renderField(fieldId))}
    </div>}
  </div>
</div>;

export default memo(Section);
