import axios from 'axios';

import { downloadFileFromUrl, downloadJsonAsFile } from './download';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  const mocked = { ...actual, get: jest.fn() };
  mocked.default = mocked;
  return mocked;
});

describe('utils - download', () => {
  let clickSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  const clickedLink = () => clickSpy.mock.instances[0];

  describe('downloadFileFromUrl', () => {
    test('requests the url as a blob, with the given params', async () => {
      axios.get.mockResolvedValue({ data: 'file contents', headers: {} });

      await downloadFileFromUrl('/some/url', { params: { since: '2026-01-01' } });

      expect(axios.get).toHaveBeenCalledWith('/some/url', expect.objectContaining({
        cancelToken: expect.anything(),
        params: { since: '2026-01-01' },
        responseType: 'blob',
      }));
    });

    test('triggers a download of the response as a file named after the given filename', async () => {
      axios.get.mockResolvedValue({ data: 'file contents', headers: { 'Content-Type': 'text/plain' } });

      await downloadFileFromUrl('/some/url', { filename: 'my-file.txt' });

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(clickedLink()).toHaveAttribute('download', 'my-file.txt');
    });

    test('falls back to the x-das-download-filename response header when no filename is given', async () => {
      axios.get.mockResolvedValue({
        data: 'file contents',
        headers: { 'Content-Type': 'text/plain', 'x-das-download-filename': 'server-name.txt' },
      });

      await downloadFileFromUrl('/some/url', {});

      expect(clickedLink()).toHaveAttribute('download', 'server-name.txt');
    });

    test('downloads a blob built from the response body using its content type', async () => {
      axios.get.mockResolvedValue({ data: 'file contents', headers: { 'Content-Type': 'text/plain' } });

      const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL');

      await downloadFileFromUrl('/some/url', { filename: 'my-file.txt' });

      const [blob] = createObjectURLSpy.mock.calls[0];
      expect(blob.type).toBe('text/plain');
      await expect(blob.text()).resolves.toBe('file contents');
    });
  });

  describe('downloadJsonAsFile', () => {
    test('triggers a download of the given data as a JSON file, without any network request', () => {
      downloadJsonAsFile({ type: 'FeatureCollection', features: [] }, 'track.geojson');

      expect(axios.get).not.toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(clickedLink()).toHaveAttribute('download', 'track.geojson');
    });

    test('downloads a JSON blob serialized from the given data', async () => {
      const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL');

      downloadJsonAsFile({ type: 'FeatureCollection', features: [] }, 'track.geojson');

      const [blob] = createObjectURLSpy.mock.calls[0];
      expect(blob.type).toBe('application/json');
      await expect(blob.text()).resolves.toBe(JSON.stringify({ type: 'FeatureCollection', features: [] }));
    });
  });
});
