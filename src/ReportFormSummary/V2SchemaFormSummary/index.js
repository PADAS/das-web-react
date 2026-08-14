import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../utils/form-schemas/constants';
import getHumanizedFieldValue from '../../utils/form-schemas/getHumanizedFieldValue';
import normalizeChoiceListValues from '../../utils/form-schemas/normalizeChoiceListValues';
import { selectCoordinatesRepresentation } from '../../selectors/location';
import transformSchemaToFormElements from '../../utils/form-schemas/transformSchemaToFormElements';

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

const HeaderSummary = ({ header }) => <p className={styles[`header-${header.details.size.toLowerCase()}`]}>
  {header.details.label}
</p>;

const SectionSummary = ({ formData, formElements, section }) => <div className={styles.section}>
  <hr className={styles.separator} />

  {section.details.label && <p className={styles.sectionLabel}>{section.details.label}</p>}

  <div className={styles.columns}>
    <div className={`${styles.column} ${section.details.columns === 1 ? styles.fullWidth : styles.halfWidthLeft}`}>
      {section.details.leftColumn.map((fieldId) => formElements[fieldId].type === FORM_ELEMENT_TYPES.HEADER
        ? <HeaderSummary header={formElements[fieldId]} key={fieldId} />
        : <FieldSummary field={formElements[fieldId]} formData={formData} id={fieldId} key={fieldId} />)}
    </div>

    {section.details.columns === 2 && <div className={`${styles.column} ${styles.halfWidthRight}`}>
      {section.details.rightColumn.map((fieldId) => formElements[fieldId].type === FORM_ELEMENT_TYPES.HEADER
        ? <HeaderSummary header={formElements[fieldId]} key={fieldId} />
        : <FieldSummary field={formElements[fieldId]} formData={formData} id={fieldId} key={fieldId} />)}
    </div>}
  </div>
</div>;

const V2SchemaFormSummary = ({ eventSchema, formData }) => {
  const formElements = useMemo(() => transformSchemaToFormElements(eventSchema), [eventSchema]);

  // Legacy choices stored as whole option objects would render as "[object Object]".
  const normalizedFormData = useMemo(() => normalizeChoiceListValues(formData), [formData]);

  return formElements[ROOT_CANVAS_ID]?.details.sections.map((sectionId) => <SectionSummary
    formData={normalizedFormData}
    formElements={formElements}
    section={formElements[sectionId]}
    key={sectionId}
  />);
};

export default V2SchemaFormSummary;
