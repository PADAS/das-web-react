import { useCallback, useMemo } from 'react';
import Ajv2020 from 'ajv/dist/2020';
import { useTranslation } from 'react-i18next';

const ajv = new Ajv2020({ allErrors: true });

const useSchemaValidations = (schema) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.errors' });

  const validate = useMemo(() => ajv.compile(schema.json), [schema.json]);

  const runValidations = useCallback((formData) => {
    if (!validate(formData)) {
      const fieldErrors = validate.errors.reduce((accumulator, error) => {
        if (error.keyword === 'required') {
          return { ...accumulator, [error.params.missingProperty]: t('required') };
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
