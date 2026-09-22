import { renderHook, waitFor } from '../test-utils';

import { fetchFileAsObjectUrlFromUrl } from '../utils/file';

import useMediaObjectUrl from './useMediaObjectUrl';

jest.mock('../utils/file', () => ({
  ...jest.requireActual('../utils/file'),
  fetchFileAsObjectUrlFromUrl: jest.fn(),
}));

describe('useMediaObjectUrl', () => {
  let revokeObjectURLSpy;
  beforeEach(() => {
    fetchFileAsObjectUrlFromUrl.mockResolvedValue('blob:clip');

    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');
  });

  test('does not fetch anything without a url', () => {
    const { result } = renderHook(() => useMediaObjectUrl(null));

    expect(fetchFileAsObjectUrlFromUrl).not.toHaveBeenCalled();
    expect(result.current).toEqual({ error: false, objectUrl: null });
  });

  test('fetches the url and returns the resulting object url', async () => {
    const { result } = renderHook(() => useMediaObjectUrl('https://example.com/clip.mp4'));

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:clip'));

    expect(fetchFileAsObjectUrlFromUrl).toHaveBeenCalledWith('https://example.com/clip.mp4');
    expect(result.current.error).toBe(false);
  });

  test('reports an error when the fetch fails', async () => {
    fetchFileAsObjectUrlFromUrl.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useMediaObjectUrl('https://example.com/clip.mp4'));

    await waitFor(() => expect(result.current.error).toBe(true));

    expect(result.current.objectUrl).toBeNull();
  });

  test('revokes the object url on unmount', async () => {
    const { result, unmount } = renderHook(() => useMediaObjectUrl('https://example.com/clip.mp4'));

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:clip'));

    unmount();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:clip');
  });

  test('revokes the previous object url and refetches when the url changes', async () => {
    const { rerender, result } = renderHook(({ url }) => useMediaObjectUrl(url), {
      initialProps: { url: 'https://example.com/clip.mp4' },
    });

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:clip'));

    fetchFileAsObjectUrlFromUrl.mockResolvedValue('blob:interview');
    rerender({ url: 'https://example.com/interview.m4a' });

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:clip');

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:interview'));
  });

  test('revokes a fetch that resolves after the url has already changed', async () => {
    let resolveSlowFetch;
    fetchFileAsObjectUrlFromUrl.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSlowFetch = resolve; })
    );

    const { rerender, result } = renderHook(({ url }) => useMediaObjectUrl(url), {
      initialProps: { url: 'https://example.com/slow.mp4' },
    });

    fetchFileAsObjectUrlFromUrl.mockResolvedValue('blob:fast');
    rerender({ url: 'https://example.com/fast.mp4' });

    await waitFor(() => expect(result.current.objectUrl).toBe('blob:fast'));

    resolveSlowFetch('blob:slow');

    await waitFor(() => expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:slow'));

    expect(result.current.objectUrl).toBe('blob:fast');
  });
});
