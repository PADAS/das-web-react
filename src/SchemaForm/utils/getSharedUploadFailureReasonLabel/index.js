import i18next from 'i18next';

// Failures that do not share one recognized reason have no label, so callers
// fall back to their generic copy.
const getSharedUploadFailureReasonLabel = (uploadFailureReasons) => {
  const t = i18next.getFixedT(null, 'schema-form', 'uploadFailureReasons');

  const sharedReason = uploadFailureReasons.every((reason) => reason === uploadFailureReasons[0])
    ? uploadFailureReasons[0]
    : null;

  return sharedReason ? t(sharedReason, { defaultValue: '' }) : '';
};

export default getSharedUploadFailureReasonLabel;
