import React from 'react';
import { Provider } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { downloadFileFromUrl } from '../utils/download';
import { fetchFileAsObjectUrlFromUrl } from '../utils/file';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import MediaModal from '.';

jest.mock('../utils/download', () => ({
  ...jest.requireActual('../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

jest.mock('../utils/file', () => ({
  ...jest.requireActual('../utils/file'),
  fetchFileAsObjectUrlFromUrl: jest.fn(),
}));

describe('MediaModal', () => {
  let store;
  beforeEach(() => {
    downloadFileFromUrl.mockImplementation(() => {});
    fetchFileAsObjectUrlFromUrl.mockResolvedValue('blob:fake-object-url');

    store = mockStore({});
  });

  const renderModal = (props) => render(
    <Provider store={store}>
      <MediaModal id="modal-1" title="attachment.mp4" tracker={{ track: jest.fn() }} {...props} />
    </Provider>
  );

  test('renders an image by default', () => {
    renderModal({ src: 'data:image/png;base64,test' });

    expect(screen.getByAltText('attachment.mp4')).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  test('does not fetch the media file when a src is provided', () => {
    renderModal({ mediaType: 'video', src: 'blob:already-fetched' });

    expect(fetchFileAsObjectUrlFromUrl).not.toHaveBeenCalled();
    expect(document.querySelector('video')).toHaveAttribute('src', 'blob:already-fetched');
  });

  test('fetches the media file itself and plays it when no src is provided', async () => {
    renderModal({ mediaType: 'video', src: null, url: 'https://example.com/clip.mp4' });

    const video = await screen.findByLabelText('attachment.mp4');

    expect(fetchFileAsObjectUrlFromUrl).toHaveBeenCalledWith('https://example.com/clip.mp4', { signal: expect.any(AbortSignal) });
    expect(video.tagName).toBe('VIDEO');
    expect(video).toHaveAttribute('src', 'blob:fake-object-url');
    expect(video).toHaveAttribute('controls');
  });

  test('shows an error message if the video fails to load', () => {
    renderModal({ mediaType: 'video', src: 'blob:already-fetched' });

    fireEvent.error(document.querySelector('video'));

    expect(screen.getByText('Error loading file.')).toBeInTheDocument();
  });

  test('shows an error message when its own media fetch fails', async () => {
    fetchFileAsObjectUrlFromUrl.mockRejectedValue(new Error('network error'));

    renderModal({ mediaType: 'video', src: null, url: 'https://example.com/clip.mp4' });

    expect(await screen.findByText('Error loading file.')).toBeInTheDocument();
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  test('downloads the file using the provided url and title when clicking download', async () => {
    const { container } = renderModal({ mediaType: 'video', src: 'blob:already-fetched', url: 'https://example.com/original/clip.mp4' });

    await userEvent.click(container.querySelector('svg'));

    expect(downloadFileFromUrl).toHaveBeenCalledWith('https://example.com/original/clip.mp4', { filename: 'attachment.mp4' });
  });
});
