import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { FORM_ELEMENT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

const computeUploadErrors = (formData, formElements, userContent, t, parentCollectionFieldId = null) => {
  const errors = {};

  Object.entries(formData).forEach(([fieldName, fieldValue]) => {
    const fieldId = parentCollectionFieldId ? `${parentCollectionFieldId}.${fieldName}` : fieldName;

    if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.ATTACHMENT) {
      if (Array.isArray(fieldValue) && fieldValue.length > 0) {
        // The field is an attachment with uploads.
        const hasPending = fieldValue.some(
          ({ uploadId }) => userContent[uploadId]?.status === 'pending'
            || userContent[uploadId]?.status === 'uploading'
        );
        const hasFailed = fieldValue.some(({ uploadId }) => userContent[uploadId]?.status === 'failed');
        if (hasPending) {
          // The attachment has pending uploads.
          errors[fieldName] = { message: t('uploadInProgressError') };
        } else if (hasFailed) {
          // The attachment has failed uploads.
          errors[fieldName] = { message: t('uploadFailedError') };
        }
      }
    } else if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.COLLECTION && Array.isArray(fieldValue)) {
      // The field is a collection. Compute the upload errors for each of its
      // items.
      const collectionUploadErrors = {};

      fieldValue.forEach((itemFormData, index) => {
        const itemUploadErrors = computeUploadErrors(itemFormData, formElements, userContent, t, fieldId);
        if (Object.keys(itemUploadErrors).length > 0) {
          collectionUploadErrors[index] = itemUploadErrors;
        }
      });

      if (Object.keys(collectionUploadErrors).length > 0) {
        errors[fieldName] = { message: t('collectionItems'), ...collectionUploadErrors };
      }
    }
  });

  return errors;
};

const useUploadValidations = (formElements) => {
  const { t } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.errors',
  });

  const store = useStore();

  const runValidations = useCallback(
    (formData) => {
      const userContent = store.getState().data.userContent;

      return computeUploadErrors(formData, formElements, userContent, t);
    },
    [formElements, store, t]
  );

  return runValidations;
};

export default useUploadValidations;
