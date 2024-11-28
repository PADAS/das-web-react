import React, { useCallback, useMemo, useState } from 'react';
import Ajv2020 from 'ajv/dist/2020';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from './constants';
import makeFieldsFromSchema from './utils/makeFieldsFromSchema';

import Header from './fields/Header';
import SchemaFormContext from './SchemaFormContext';
import Section from './fields/Section';
import Text from './fields/Text';

export const FIELDS = {
  [FORM_ELEMENT_TYPES.HEADER]: Header,
  [FORM_ELEMENT_TYPES.SECTION]: Section,
  [FORM_ELEMENT_TYPES.TEXT]: Text,
};

const ajv = new Ajv2020({ allErrors: true });

const SchemaForm = ({ formData, onFormDataChange, onFormSubmit, renderSubmitButton, schema }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm' });

  const [fieldErrors, setFieldErrors] = useState({});

  const fields = useMemo(() => makeFieldsFromSchema(schema), [schema]);

  const fieldValues = useMemo(() => Object.entries(formData).reduce((accumulator, [fieldId, fieldValue]) => {
    // TODO: Collections will require recusivity here.

    return { ...accumulator, [fieldId]: fieldValue };
  }, {}), [formData]);

  const validate = useMemo(() => ajv.compile(schema.json), [schema.json]);

  const onFieldChange = useCallback((fieldId, value) => {
    // TODO: Collections will require recusivity here.
    // If the value is empty, set it as undefined so AJV validation returns errors for required fields.
    const newFormData = { ...formData, [fieldId]: value || undefined };

    onFormDataChange(newFormData);
    setFieldErrors((fieldErrors) => ({ ...fieldErrors, [fieldId]: undefined }));
  }, [formData, onFormDataChange]);

  const onSubmit = (event) => {
    event.preventDefault();

    const valid = validate(formData);
    if (!valid) {
      const fieldErrors = validate.errors.reduce((accumulator, error) => {
        if (error.keyword === 'required') {
          return { ...accumulator, [error.params.missingProperty]: t('errors.required') };
        }

        // TODO: Transform missing errors.

        return accumulator;
      }, {});

      setFieldErrors(fieldErrors);
    } else {
      onFormSubmit({ formData });
    }
  };

  const renderField = (fieldId) => {
    const { type } = fields[fieldId];

    const Field = FIELDS[type];

    return <Field id={fieldId} key={fieldId} renderField={renderField} />;
  };

  return <SchemaFormContext.Provider value={{ fields, fieldErrors, fieldValues, onFieldChange }}>
    <form onSubmit={onSubmit}>
      {fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <Section
        id={sectionId}
        key={sectionId}
        renderField={renderField}
      />)}

      {renderSubmitButton()}
    </form>
  </SchemaFormContext.Provider>;
};

SchemaForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onFormDataChange: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  renderSubmitButton: PropTypes.func.isRequired,
  schema: PropTypes.object.isRequired,
};

export default SchemaForm;
