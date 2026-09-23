import React from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';

import { renderHook } from '../../../test-utils';
import i18n from '../../../i18nForTests';
import { mockStore } from '../../../__test-helpers/MockStore';
import { FORM_ELEMENT_TYPES } from '../../../utils/form-schemas/constants';
import { UPLOAD_FAILURE_REASONS } from '../../../ducks/user-content';

import useUploadValidations from '.';

describe('SchemaForm - Utils - useUploadValidations', () => {
  let formElements, store;
  beforeEach(() => {
    formElements = {
      textField: { type: FORM_ELEMENT_TYPES.TEXT },
      attachmentField: { type: FORM_ELEMENT_TYPES.ATTACHMENT },
      collectionField: { type: FORM_ELEMENT_TYPES.COLLECTION },
      'collectionField.attachmentField': { type: FORM_ELEMENT_TYPES.ATTACHMENT },
    };

    store = { data: { userContent: {} } };
  });

  const Wrapper = ({ children }) => <Provider store={mockStore(store)}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>;

  it('returns no errors if the form data is ok', () => {
    store.data.userContent = {
      'upload-1': { status: 'success' },
      'upload-2': { status: 'success' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({});
  });

  it('returns the upload in progress error', () => {
    store.data.userContent = {
      'upload-1': { status: 'in_progress' },
      'upload-2': { status: 'success' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      attachmentField: { message: 'Please wait for files to finish uploading.' },
    });
  });

  it('returns the upload failed error', () => {
    store.data.userContent = {
      'upload-1': { status: 'failed' },
      'upload-2': { status: 'success' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      attachmentField: { message: 'One or more file uploads failed. Remove the failed files before submitting.' },
    });
  });

  test.each([
    [UPLOAD_FAILURE_REASONS.TOO_LARGE, 'File is too large'],
    [UPLOAD_FAILURE_REASONS.TOO_MANY_REQUESTS, 'Too many uploads, try later'],
    [UPLOAD_FAILURE_REASONS.UNSUPPORTED_TYPE, 'File type is not allowed'],
  ])('names the %s reason in the upload failed error', (reason, reasonLabel) => {
    store.data.userContent = {
      'upload-1': { reason, status: 'failed' },
      'upload-2': { status: 'success' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      attachmentField: {
        message: `One or more file uploads failed: ${reasonLabel}. Remove the failed files before submitting.`,
      },
    });
  });

  test('returns the upload failed error without a reason when the uploads failed for different reasons', () => {
    store.data.userContent = {
      'upload-1': { reason: UPLOAD_FAILURE_REASONS.TOO_LARGE, status: 'failed' },
      'upload-1b': { reason: UPLOAD_FAILURE_REASONS.UNSUPPORTED_TYPE, status: 'failed' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }, { uploadId: 'upload-1b' }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      attachmentField: { message: 'One or more file uploads failed. Remove the failed files before submitting.' },
    });
  });

  test('returns the upload failed error without a reason when the upload failed for an unknown reason', () => {
    store.data.userContent = {
      'upload-1': { reason: UPLOAD_FAILURE_REASONS.UNKNOWN, status: 'failed' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      attachmentField: { message: 'One or more file uploads failed. Remove the failed files before submitting.' },
    });
  });

  it('prioritizes the upload in progress error over the upload failed error', () => {
    store.data.userContent = {
      'upload-1': { status: 'in_progress' },
      'upload-1b': { status: 'failed' },
      'upload-2': { status: 'success' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }, { uploadId: 'upload-1b' }],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      attachmentField: { message: 'Please wait for files to finish uploading.' },
    });
  });

  it('returns no errors if the attachment has no uploads', () => {
    store.data.userContent = {
      'upload-2': { status: 'success' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({});
  });

  it('nests errors in collection item forms', () => {
    store.data.userContent = {
      'upload-1': { status: 'success' },
      'upload-2': { status: 'in_progress' },
    };
    const formData = {
      textField: 'some text',
      attachmentField: [{ uploadId: 'upload-1' }],
      collectionField: [{ attachmentField: [{ uploadId: 'upload-2' }] }],
    };

    const { result } = renderHook(() => useUploadValidations(formElements), { wrapper: Wrapper });
    const runValidations = result.current;

    expect(runValidations(formData)).toEqual({
      collectionField: {
        message: 'Some items of this collection have errors in their inner forms.',
        0: {
          attachmentField: { message: 'Please wait for files to finish uploading.' },
        },
      },
    });
  });
});
