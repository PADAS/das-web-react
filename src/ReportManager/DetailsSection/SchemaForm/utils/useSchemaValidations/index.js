import { useCallback, useMemo } from 'react';
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020';
import { useTranslation } from 'react-i18next';

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);

const insertErrorRecursively = (fieldId, message, errorPath, errors, t) => {
  if (errorPath.length === 0) {
    // If there is no path, the error should be inserted in this errors object.
    errors[fieldId] = { message };
  } else {
    // If there is a path, we extract the collection id and the index, then inject the error recursively in the errors
    // object of that specific item.
    const parentCollectionId = errorPath[0];
    const itemIndex = errorPath[1];
    errors[parentCollectionId] = {
      ...errors[parentCollectionId] || {},
      [itemIndex]: {
        ...errors[parentCollectionId]?.[itemIndex] || {},
      },
    };

    errors[parentCollectionId].message = errors[parentCollectionId].message
      ? `${errors[parentCollectionId].message} ${t('collectionItems')}`
      : t('collectionItems');

    insertErrorRecursively(fieldId, message, errorPath.slice(2), errors[parentCollectionId][itemIndex], t);
  }
};

const useSchemaValidations = (schema) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.errors' });

  const validate = useMemo(() => ajv.compile(schema.json), [schema.json]);

  const runValidations = useCallback((formData) => {
    if (!validate(formData)) {
      // If the validation returned errors we iterate them.
      return validate.errors.reduce((accumulator, error) => {
        // First we calculate the error path, the field id and the message. The error path tells us if the erroneus
        // field is nested in a collection and in which of its items.
        let errorPath;
        let fieldId;
        let message;
        switch (error.keyword) {
        case 'format':
          errorPath = error.instancePath.split('/').slice(1);
          fieldId = errorPath.pop();

          switch (error.params.format) {
          case 'date':
            message = t('dateFormat');
            break;

          case 'date-time':
            message = t('dateTimeFormat');
            break;

          case 'time':
            message = t('timeFormat');
            break;

          default:
            message = t('defaultFormat');
          };
          break;

        case 'maxItems':
          errorPath = error.instancePath.split('/').slice(1);
          fieldId = errorPath.pop();
          message = t('maxItems', { count: error.params.limit  });
          break;

        case 'minItems':
          errorPath = error.instancePath.split('/').slice(1);
          fieldId = errorPath.pop();
          message = t('minItems', { count: error.params.limit  });
          break;

        case 'required':
          errorPath = error.instancePath.split('/').slice(1);
          fieldId = error.params.missingProperty;
          message = t('required');
          break;

        default:
          return accumulator;
        }

        // Then, we insert the error in the accumulated errors structure.
        const errors = structuredClone(accumulator);
        insertErrorRecursively(fieldId, message, errorPath, errors, t);

        return errors;
      }, {});
    }
    return null;
  }, [t, validate]);

  return runValidations;
};

export default useSchemaValidations;
