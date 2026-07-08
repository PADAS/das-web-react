import React from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';

import { renderHook } from '../../../../../test-utils';
import i18n from '../../../../../i18nForTests';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { FORM_ELEMENT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

import useUploadValidations from '.';

describe('ReportManager - DetailsSection - SchemaForm - Utils - useUploadValidations', () => {
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
      'upload-1': { status: 'pending' },
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

  it('returns the upload in progress error when the upload status is uploading', () => {
    store.data.userContent = {
      'upload-1': { status: 'uploading' },
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

  it('prioritizes the upload in progress error over the upload failed error', () => {
    store.data.userContent = {
      'upload-1': { status: 'pending' },
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
      'upload-2': { status: 'pending' },
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
