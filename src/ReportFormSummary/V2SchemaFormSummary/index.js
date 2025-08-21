import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../utils/v2-event-schemas/constants';
import getHumanizedFieldValue from '../../utils/v2-event-schemas/getHumanizedFieldValue';
import makeFieldsFromSchema from '../../utils/v2-event-schemas/makeFieldsFromSchema';
import { selectCoordinatesRepresentation } from '../../selectors/location';

import * as styles from './styles.module.scss';

const FieldSummary = ({ field, formData, id }) => {
  const { i18n, t } = useTranslation('details-view', { keyPrefix: 'reportFormSummary.v2SchemaFormSummary' });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  return <>
    <p className={styles.fieldLabel}>{field.details.label}</p>

    <p className={styles.fieldValue}>{getHumanizedFieldValue(
      field,
      formData[id],
      '-',
      i18n.language,
      coordinatesRepresentation,
      t
    )}</p>
  </>;
};

const SectionSummary = ({ details, fields, formData }) => <div className={styles.section}>
  <hr className={styles.separator} />

  {details.label && <p className={styles.sectionLabel}>{details.label}</p>}

  <div className={styles.columns}>
    <div className={`${styles.column} ${details.columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}>
      {details.leftColumn.map((fieldId) => fields[fieldId].type === FORM_ELEMENT_TYPES.HEADER
        ? <p
          className={styles[`header-${fields[fieldId].details.size.toLowerCase()}`]}
          key={fieldId}>
          {fields[fieldId].details.label}
        </p>
        : <FieldSummary
          field={fields[fieldId]}
          formData={formData}
          id={fieldId}
          key={fieldId}
        />)}
    </div>

    {details.columns === 2 && <div className={`${styles.column} ${styles.halfWidthRight}`}>
      {details.rightColumn.map((fieldId) => <FieldSummary
        field={fields[fieldId]}
        formData={formData}
        id={fieldId}
        key={fieldId}
      />)}
    </div>}
  </div>
</div>;

// For V2 schemas, we have a customized rendering of the details using utility functions like makeFieldsFromSchema and
// getHumanizedFieldValue following the schema definition.
const V2SchemaFormSummary = ({ eventSchema, formData }) => {
  const fields = useMemo(() => makeFieldsFromSchema(eventSchema), [eventSchema]);

  return fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <SectionSummary
    details={fields[sectionId].details}
    fields={fields}
    formData={formData}
    key={sectionId}
  />);
};

export default V2SchemaFormSummary;
