import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import evaluateSectionConditions from '../utils/form-schemas/evaluateSectionConditions';
import normalizeChoiceListValues from '../utils/form-schemas/normalizeChoiceListValues';
import { ROOT_CANVAS_ID } from '../utils/form-schemas/constants';
import { selectCoordinatesRepresentation } from '../selectors/location';
import transformSchemaToFormElements from '../utils/form-schemas/transformSchemaToFormElements';

import Section from './Section';

import * as styles from './styles.module.scss';

const SchemaFormSummary = ({ className = '', formData, schema, sectionClassName = '' }) => {
  // Field values are humanized against the language i18next holds when they
  // are read, so this memoized summary subscribes to redraw when it changes.
  useTranslation('schema-form');

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const formElements = useMemo(() => transformSchemaToFormElements(schema), [schema]);

  const normalizedFormData = useMemo(() => normalizeChoiceListValues(formData, formElements), [formData, formElements]);

  const visibleSectionIds = useMemo(
    () => formElements[ROOT_CANVAS_ID]?.details.sections.filter((sectionId) => evaluateSectionConditions(
      formElements[sectionId].details.conditions,
      formElements[sectionId].details.conditionsLogicalOperator,
      normalizedFormData
    )) ?? [],
    [formElements, normalizedFormData]
  );

  if (visibleSectionIds.length === 0) {
    return null;
  }

  return <div className={`${styles.schemaFormSummary} ${className}`}>
    {visibleSectionIds.map((sectionId) => <Section
      className={sectionClassName}
      coordinatesRepresentation={coordinatesRepresentation}
      formData={normalizedFormData}
      formElements={formElements}
      key={sectionId}
      section={formElements[sectionId]}
    />)}
  </div>;
};

export default memo(SchemaFormSummary);
