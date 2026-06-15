import { useCallback, useMemo } from 'react';
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020';
import { useTranslation } from 'react-i18next';

import { TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN } from '../../../../../utils/v2-event-schemas/constants';

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
ajv.addKeyword({ keyword: 'x-section', schemaType: 'string' });
ajv.addKeyword({ keyword: 'x-enumExtra', schemaType: 'object' });

const insertErrorRecursively = (fieldName, message, errorPath, errors, t) => {
  if (errorPath.length === 0) {
    // If there is no path, the error should be inserted in this errors object.
    errors[fieldName] = { message };
  } else {
    // If there is a path, the error should be inserted in the parent collection errors object.
    const parentCollectionName = errorPath[0];
    const itemIndex = errorPath[1];
    errors[parentCollectionName] = {
      ...errors[parentCollectionName] || {},
      [itemIndex]: {
        ...errors[parentCollectionName]?.[itemIndex] || {},
      },
    };

    if (!errors[parentCollectionName].message) {
      errors[parentCollectionName].message = t('collectionItems');
    }

    insertErrorRecursively(fieldName, message, errorPath.slice(2), errors[parentCollectionName][itemIndex], t);
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
        const errorPath = error.instancePath.split('/').slice(1);
        let fieldName;
        let message;
        switch (error.keyword) {
        case 'format':
          fieldName = errorPath.pop();

          switch (error.params.format) {
          case 'email':
            message = t('emailFormat');
            break;

          case 'date':
            message = t('dateFormat');
            break;

          case 'date-time':
            message = t('dateTimeFormat');
            break;

          case 'time':
            message = t('timeFormat');
            break;

          case 'uri':
            message = t('uriFormat');
            break;

          case 'uuid':
            message = t('uuidFormat');
            break;

          default:
            message = t('defaultFormat');
          };
          break;

        case 'maximum':
          fieldName = errorPath.pop();
          message = t('maximum', { maximum: error.params.limit });
          break;

        case 'maxItems':
          fieldName = errorPath.pop();
          message = t('maxItems', { count: error.params.limit  });
          break;

        case 'minimum':
          fieldName = errorPath.pop();
          message = t('minimum', { minimum: error.params.limit });
          break;

        case 'minItems':
          fieldName = errorPath.pop();
          message = t('minItems', { count: error.params.limit  });
          break;

        case 'pattern':
          fieldName = errorPath.pop();

          switch (error.params.pattern) {
          case TEXT_ELEMENT_ALPHANUMERIC_FORMAT_VALIDATION_PATTERN:
            message = t('alphanumericPattern');
            break;

          default:
            message = t('defaultPattern');
          };
          break;

        case 'required':
          fieldName = error.params.missingProperty;
          message = t('required');
          break;

        default:
          fieldName = error.params?.additionalProperty
            ?? error.params?.unevaluatedProperty
            ?? error.params?.propertyName
            ?? errorPath.pop();
          message = t('defaultKeyword');
        }

        // Then, we insert the error in the accumulated errors structure.
        const errors = structuredClone(accumulator);
        insertErrorRecursively(fieldName, message, errorPath, errors, t);

        return errors;
      }, {});
    }
    return null;
  }, [t, validate]);

  return runValidations;
};

export default useSchemaValidations;
