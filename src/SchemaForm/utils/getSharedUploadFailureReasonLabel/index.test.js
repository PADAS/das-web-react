import '../../../i18nForTests';

import { UPLOAD_FAILURE_REASONS } from '../../../ducks/user-content';

import getSharedUploadFailureReasonLabel from './';

describe('SchemaForm - utils - getSharedUploadFailureReasonLabel', () => {
  test.each([
    [UPLOAD_FAILURE_REASONS.TOO_LARGE, 'File is too large'],
    [UPLOAD_FAILURE_REASONS.TOO_MANY_REQUESTS, 'Too many uploads, try later'],
    [UPLOAD_FAILURE_REASONS.UNSUPPORTED_TYPE, 'File type is not allowed'],
  ])('returns the label of the %s reason', (reason, label) => {
    expect(getSharedUploadFailureReasonLabel([reason])).toBe(label);
  });

  test('returns the label when every failure shares the same reason', () => {
    const reasons = [UPLOAD_FAILURE_REASONS.TOO_LARGE, UPLOAD_FAILURE_REASONS.TOO_LARGE];

    expect(getSharedUploadFailureReasonLabel(reasons)).toBe('File is too large');
  });

  test('returns no label when the failures have different reasons', () => {
    const reasons = [UPLOAD_FAILURE_REASONS.TOO_LARGE, UPLOAD_FAILURE_REASONS.UNSUPPORTED_TYPE];

    expect(getSharedUploadFailureReasonLabel(reasons)).toBe('');
  });

  test('returns no label for an unknown reason', () => {
    expect(getSharedUploadFailureReasonLabel([UPLOAD_FAILURE_REASONS.UNKNOWN])).toBe('');
  });

  test('returns no label when the reason is missing', () => {
    expect(getSharedUploadFailureReasonLabel([undefined])).toBe('');
  });

  test('returns no label when there are no failures', () => {
    expect(getSharedUploadFailureReasonLabel([])).toBe('');
  });
});
