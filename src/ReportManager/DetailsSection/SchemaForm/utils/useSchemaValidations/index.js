import { useCallback, useMemo } from 'react';
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020';
import { useTranslation } from 'react-i18next';

const ajv = new Ajv2020({ allErrors: true });

const useSchemaValidations = (schema) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.errors' });

  const validate = useMemo(() => ajv.compile(schema.json), [schema.json]);

  const runValidations = useCallback((formData) => {
    if (!validate(formData)) {
      const fieldErrors = validate.errors.reduce((accumulator, error) => {
        if (error.keyword === 'format') {
          if (error.params.format === 'date') {
            const fieldId = error.instancePath.split('/').pop();
            return { ...accumulator, [fieldId]: t('dateFormat') };
          }
          if (error.params.format === 'date-time') {
            const fieldId = error.instancePath.split('/').pop();
            return { ...accumulator, [fieldId]: t('dateTimeFormat') };
          }
          if (error.params.format === 'time') {
            const fieldId = error.instancePath.split('/').pop();
            return { ...accumulator, [fieldId]: t('timeFormat') };
          }
        }
        if (error.keyword === 'required') {
          const fieldId = error.params.missingProperty;
          return { ...accumulator, [fieldId]: t('required') };
        }

        if (error.keyword === 'minimum' || error.keyword === 'maximum' ) {
          const fieldId = error.instancePath.split('/').pop();
          const fieldProps = schema.json.properties[fieldId];
          return {
            ...accumulator,
            [fieldId]: t(`outOfRange.${error.keyword}`, {
              [error.keyword]: fieldProps[error.keyword]
            })
          };
        }

        // TODO: Transform missing errors.

        return accumulator;
      }, {});

      return fieldErrors;
    }
    return null;
  }, [t, validate]);

  return runValidations;
};

export default useSchemaValidations;
