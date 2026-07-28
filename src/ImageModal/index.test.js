import React from 'react';
import { Provider } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { downloadFileFromUrl } from '../utils/download';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import ImageModal from '.';

jest.mock('../utils/download', () => ({
  ...jest.requireActual('../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

describe('ImageModal', () => {
  let store;
  beforeEach(() => {
    downloadFileFromUrl.mockImplementation(() => {});

    store = mockStore({});
  });

  const renderModal = (props) => render(
    <Provider store={store}>
      <ImageModal id="modal-1" title="attachment.mp4" tracker={{ track: jest.fn() }} {...props} />
    </Provider>
  );

  test('renders an image by default', () => {
    renderModal({ src: 'data:image/png;base64,test' });

    expect(screen.getByAltText('attachment.mp4')).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  test('renders a video when mediaType is video', () => {
    renderModal({ mediaType: 'video', src: 'https://example.com/clip.mp4' });

    const video = document.querySelector('video');

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/clip.mp4');
    expect(video).toHaveAttribute('controls');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('shows an error message if the video fails to load', () => {
    renderModal({ mediaType: 'video', src: 'https://example.com/clip.mp4' });

    fireEvent.error(document.querySelector('video'));

    expect(screen.getByText('Error loading image.')).toBeInTheDocument();
  });

  test('shows an error message when the fetchError prop is set', () => {
    renderModal({ fetchError: true, mediaType: 'video', src: null });

    expect(screen.getByText('Error loading image.')).toBeInTheDocument();
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  test('downloads the file using the provided url and title when clicking download', async () => {
    const { container } = renderModal({ mediaType: 'video', src: 'https://example.com/clip.mp4', url: 'https://example.com/original/clip.mp4' });

    await userEvent.click(container.querySelector('svg'));

    expect(downloadFileFromUrl).toHaveBeenCalledWith('https://example.com/original/clip.mp4', { filename: 'attachment.mp4' });
  });
});
