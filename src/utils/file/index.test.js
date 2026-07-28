import axios from 'axios';

import { showToast } from '../toast';
import {
  convertFileListToArray,
  fetchFileAsObjectUrlFromUrl,
  fetchImageAsBase64FromUrl,
  filterDuplicateUploadFilenames,
} from './';

jest.mock('axios');

jest.mock('../toast', () => ({
  showToast: jest.fn(),
}));

describe('Utils - File', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('convertFileListToArray', () => {
    test('converts a list of files to an array', () => {
      const file1 = new File(['content'], 'file1.txt');
      const file2 = new File(['content'], 'file2.txt');
      const fileList = { 0: file1, 1: file2, length: 2, [Symbol.iterator]: Array.prototype[Symbol.iterator] };

      const result = convertFileListToArray(fileList);

      expect(result).toEqual([file1, file2]);
    });

    test('returns an empty array if the list is null', () => {
      expect(convertFileListToArray(null)).toEqual([]);
    });
  });

  describe('fetchImageAsBase64FromUrl', () => {
    test('fetches an image as a base64 string from a url', async () => {
      const fakeData = Buffer.from('fake-image-data');
      axios.get.mockResolvedValue({ data: fakeData });

      const result = await fetchImageAsBase64FromUrl('https://example.com/image.png');

      expect(axios.get).toHaveBeenCalledWith('https://example.com/image.png', { responseType: 'arraybuffer' });
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    test('uses the content-type from the response header when present', async () => {
      const fakeData = Buffer.from('fake-image-data');
      axios.get.mockResolvedValue({ data: fakeData, headers: { 'content-type': 'image/jpeg' } });

      const result = await fetchImageAsBase64FromUrl('https://example.com/image.jpg');

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    test('falls back to image/png when the response has no headers', async () => {
      const fakeData = Buffer.from('fake-image-data');
      axios.get.mockResolvedValue({ data: fakeData, headers: undefined });

      const result = await fetchImageAsBase64FromUrl('https://example.com/image.png');

      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('fetchFileAsObjectUrlFromUrl', () => {
    test('fetches the file as a blob and returns an object url created from it', async () => {
      const fakeBlob = new Blob(['fake-media-data']);
      axios.get.mockResolvedValue({ data: fakeBlob });

      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-object-url');

      const result = await fetchFileAsObjectUrlFromUrl('https://example.com/clip.mp4');

      expect(axios.get).toHaveBeenCalledWith('https://example.com/clip.mp4', { responseType: 'blob' });
      expect(createObjectURLSpy).toHaveBeenCalledWith(fakeBlob);
      expect(result).toBe('blob:fake-object-url');

      createObjectURLSpy.mockRestore();
    });
  });

  describe('filterDuplicateUploadFilenames', () => {
    test('shows a toast if a filename already exists and filters out the duplicate file', () => {
      const currentFiles = [{ filename: 'existing.txt' }];
      const newFiles = [
        new File(['content'], 'existing.txt'),
        new File(['content'], 'new.txt'),
      ];

      const result = filterDuplicateUploadFilenames(currentFiles, newFiles);

      expect(showToast).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('new.txt');
    });

    test('returns the new files if no duplicates are found', () => {
      const currentFiles = [{ filename: 'existing.txt' }];
      const newFiles = [
        new File(['content'], 'file1.txt'),
        new File(['content'], 'file2.txt'),
      ];

      const result = filterDuplicateUploadFilenames(currentFiles, newFiles);

      expect(showToast).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });
});
