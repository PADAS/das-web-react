import { selectUploadStatesByIds } from './';

describe('Selectors - User content', () => {
  const state = {
    data: {
      userContent: {
        'upload-id-1': { status: 'uploading', progress: 50 },
        'upload-id-2': { status: 'done' },
        'upload-id-3': { status: 'error', message: 'Network failure' },
      },
    },
  };

  describe('selectUploadStatesByIds', () => {
    test('returns the upload states by ids', () => {
      expect(selectUploadStatesByIds(state, ['upload-id-1', 'upload-id-2'])).toEqual({
        'upload-id-1': { status: 'uploading', progress: 50 },
        'upload-id-2': { status: 'done' },
      });
    });

    test('returns undefined for ids not present in userContent', () => {
      expect(selectUploadStatesByIds(state, ['upload-id-1', 'non-existent-id'])).toEqual({
        'upload-id-1': { status: 'uploading', progress: 50 },
        'non-existent-id': undefined,
      });
    });

    test('returns an empty object when given an empty ids array', () => {
      expect(selectUploadStatesByIds(state, [])).toEqual({});
    });
  });
});
