import React from 'react';

import { EMPTY_VALUE } from '../../constants';
import { FORM_ELEMENT_TYPES, HEADER_ELEMENT_SIZES } from '../../utils/form-schemas/constants';
import getHumanizedFieldValue from '../../utils/form-schemas/getHumanizedFieldValue';

import * as styles from './styles.module.scss';

const HEADER_THEMES = {
  [HEADER_ELEMENT_SIZES.LARGE]: styles.large,
  [HEADER_ELEMENT_SIZES.MEDIUM]: styles.medium,
  [HEADER_ELEMENT_SIZES.SMALL]: styles.small,
};

const groupColumnChildren = (columnChildIds, formElements) => {
  const groups = [];

  columnChildIds.forEach((columnChildId) => {
    if (formElements[columnChildId].type === FORM_ELEMENT_TYPES.HEADER) {
      groups.push({ headerId: columnChildId });
    } else if (groups.at(-1)?.fieldIds) {
      groups.at(-1).fieldIds.push(columnChildId);
    } else {
      groups.push({ fieldIds: [columnChildId] });
    }
  });

  return groups;
};

const Section = ({ className = '', coordinatesRepresentation, formData, formElements, section }) => {
  const renderFieldValue = (field) => {
    const humanizedFieldValue = getHumanizedFieldValue(
      field,
      formData[field.details.value],
      EMPTY_VALUE,
      coordinatesRepresentation
    );

    // An empty multiple choice list humanizes to an empty string, which would
    // read as a field with no answer rather than one left blank.
    return humanizedFieldValue === '' ? EMPTY_VALUE : humanizedFieldValue;
  };

  const renderColumn = (columnChildIds) => groupColumnChildren(columnChildIds, formElements).map((group) => {
    if (group.headerId) {
      const header = formElements[group.headerId];

      return <h4 className={`${styles.header} ${HEADER_THEMES[header.details.size]}`} key={group.headerId}>
        {header.details.label}
      </h4>;
    }

    return <dl className={styles.fields} key={group.fieldIds[0]}>
      {group.fieldIds.map((fieldId) => <div className={styles.field} key={fieldId}>
        <dt className={styles.fieldLabel}>{formElements[fieldId].details.label}</dt>

        <dd className={styles.fieldValue}>{renderFieldValue(formElements[fieldId])}</dd>
      </div>)}
    </dl>;
  });

  return <div className={`${styles.section} ${className}`}>
    {!!section.details.label && <h3 className={styles.sectionLabel}>{section.details.label}</h3>}

    <div className={styles.columns}>
      <div
        className={`${styles.column} ${section.details.columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}
      >
        {renderColumn(section.details.leftColumn)}
      </div>

      {section.details.columns === 2 && <div className={`${styles.column} ${styles.halfWidthRight}`}>
        {renderColumn(section.details.rightColumn)}
      </div>}
    </div>
  </div>;
};

export default Section;
