import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../../utils/analytics';

import { downloadFileFromUrl } from '../../../utils/download';
import { fetchFileAsObjectUrlFromUrl, fetchImageAsBase64FromUrl } from '../../../utils/file';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../../test-utils';

import AttachmentListItem from '.';

jest.mock('../../../utils/download', () => ({
  ...jest.requireActual('../../../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

jest.mock('../../../utils/file', () => ({
  ...jest.requireActual('../../../utils/file'),
  fetchFileAsObjectUrlFromUrl: jest.fn(),
  fetchImageAsBase64FromUrl: jest.fn(),
}));

describe('ActivitySection - AttachmentListItem', () => {
  let Wrapper, renderWithWrapper;
  const savedImageAttachment = {
    file_type: 'image',
    id: '1234',
    images: { icon: 'icon', original: 'original', thumbnail: 'thumbnail' },
    filename: 'file.txt',
    updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
  };
  const onCollapse = jest.fn(), onDelete = jest.fn(), onExpand = jest.fn();
  let downloadFileFromUrlMock, fetchFileAsObjectUrlFromUrlMock, fetchImageAsBase64FromUrlMock, store, mockStoreInstance;
  beforeEach(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);
    fetchImageAsBase64FromUrlMock = jest.fn();
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);
    fetchFileAsObjectUrlFromUrlMock = jest.fn().mockResolvedValue('blob:fake-object-url');
    fetchFileAsObjectUrlFromUrl.mockImplementation(fetchFileAsObjectUrlFromUrlMock);

    store = { data: {}, view: { fullScreenImage: {} } };

    mockStoreInstance = mockStore(store);


    Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
      <Provider store={mockStoreInstance}>
        <TrackerContext.Provider value={{ track: jest.fn() }}>
          {children}
        </TrackerContext.Provider>
      </Provider>;

    renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sets the filename as the title if it is defined', async () => {
    renderWithWrapper(
      <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
        />
    );

    const title = await screen.findByText('file.txt');

    expect(title).toBeDefined();
    expect(title).toHaveClass('itemTitle');
  });

  test('sets the name as the title if a filename is not defined', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
    );

    const title = await screen.findByText('file.txt');

    expect(title).toBeDefined();
    expect(title).toHaveClass('itemTitle');
  });

  test('shows the last update time if it is an existing attachment', async () => {
    renderWithWrapper(
      <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
        />
    );

    expect((await screen.findByTestId('activitySection-dateTime-1234'))).toBeDefined();
  });

  test('user can download existing attachments', async () => {
    renderWithWrapper(
      <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
        />
    );

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(0);

    const downloadButton = await screen.findByTestId('activitySection-downloadArrow-1234');
    await userEvent.click(downloadButton);

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(1);
    expect(downloadFileFromUrl).toHaveBeenCalledWith('/file.txt', { filename: 'file.txt' });
  });

  test('user can not delete existing attachments', async () => {
    renderWithWrapper(
      <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
        />
    );

    expect((await screen.queryByTestId('activitySection-trashCan-file.txt'))).toBeNull();
  });

  test('user can not download new attachments', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
    );

    expect((await screen.queryByTestId('activitySection-downloadArrow-1234'))).toBeNull();
  });

  test('user can delete new attachments', async () => {
    const attachment = { name: 'file.txt' };
    renderWithWrapper(
      <AttachmentListItem attachment={attachment} onDelete={onDelete} />
    );

    expect(onDelete).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('activitySection-trashCan-file.txt');
    await userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('saved images are collapsibles', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect((await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'))))
      .toHaveLength(1);
  });

  test('fetches the different image sizes for saved images', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledTimes(3);
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('icon');
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('original');
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('thumbnail');
  });

  test('does not render collapsibles nor fetches images for non saved images', async () => {
    const attachment = { name: 'file.png' };
    renderWithWrapper(
      <AttachmentListItem attachment={attachment} onDelete={onDelete} />
    );

    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledTimes(0);
    expect((await screen.queryAllByTestId((content) => content.startsWith('activitySection-collapse'))))
      .toHaveLength(0);
  });

  test('opens the original of an existing image in fullscreen when pressing the expand icon', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandArrowIcon = await screen.findByTestId('expand-arrow-icon');
    await userEvent.click(expandArrowIcon);

    await waitFor(() => {
      expect(mockStoreInstance.getActions()).toHaveLength(1);
      expect(mockStoreInstance.getActions()[0].type).toEqual('ADD_MODAL');
      expect(mockStoreInstance.getActions()[0].payload.src).toEqual('original');
    });
  });

  test('opens the thumbnail of an existing image in fullscreen when pressing the expand icon if the original is not loaded yet', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => url === 'original' ? undefined : Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandArrowIcon = await screen.findByTestId('expand-arrow-icon');
    await userEvent.click(expandArrowIcon);

    expect(mockStoreInstance.getActions()).toHaveLength(1);
    expect(mockStoreInstance.getActions()[0].type).toEqual('ADD_MODAL');
    expect(mockStoreInstance.getActions()[0].payload.src).toEqual('thumbnail');
  });

  test('user can open the image collapsible', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-1234'))).toHaveClass('collapse');

    const expandAttachmentButton = await screen.findByTestId('activitySection-arrowDown-1234');
    await userEvent.click(expandAttachmentButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the image collapsible', async () => {
    renderWithWrapper(
      <AttachmentListItem
          attachment={savedImageAttachment}
          cardsExpanded={[savedImageAttachment]}
          onCollapse={onCollapse}
          onExpand={onExpand}
        />
    );

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('activitySection-collapse-1234'))).toHaveClass('show');

    const colapseAttachmentButton = await screen.findByTestId('activitySection-arrowUp-1234');
    await userEvent.click(colapseAttachmentButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('opens the fullscreen mode when pressing the image expanded', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandedImage = await screen.findByRole('img');
    await userEvent.click(expandedImage);

    expect(mockStoreInstance.getActions()).toHaveLength(1);
    expect(mockStoreInstance.getActions()[0].type).toEqual('ADD_MODAL');
    expect(mockStoreInstance.getActions()[0].payload.src).toEqual('original');
  });

  test('replaces the expanded image with the original once it is loaded', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => url === 'original'
      ? new Promise((resolve) => setTimeout(() => resolve(url), 50))
      : Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const expandedImage = await screen.findByRole('img');

    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'thumbnail');
    });

    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'original');
    });
  });

  describe('video attachments', () => {
    const savedVideoAttachment = {
      file_type: 'video',
      id: '5678',
      filename: 'clip.mp4',
      updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
      url: 'https://example.com/clip.mp4',
    };

    test('is collapsible', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect((await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'))))
        .toHaveLength(1);
    });

    test('does not fetch image data', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledTimes(0);
    });

    test('does not fetch the media file until the row is expanded', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      await screen.findByText('clip.mp4');

      expect(fetchFileAsObjectUrlFromUrlMock).not.toHaveBeenCalled();
    });

    test('shows a loading spinner while the media file is being fetched', () => {
      fetchFileAsObjectUrlFromUrlMock.mockImplementation(() => new Promise(() => {}));

      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[savedVideoAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect(screen.getByTestId('activitySection-mediaLoading-5678')).toBeInTheDocument();
      expect(screen.queryByTestId('activitySection-video-5678')).not.toBeInTheDocument();
    });

    test('shows an error message instead of the player if the media fetch fails', async () => {
      fetchFileAsObjectUrlFromUrlMock.mockRejectedValue(new Error('network error'));

      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[savedVideoAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect(await screen.findByTestId('activitySection-mediaError-5678')).toHaveTextContent('Unable to load this file.');
      expect(screen.queryByTestId('activitySection-video-5678')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activitySection-mediaLoading-5678')).not.toBeInTheDocument();
    });

    test('refetches the media file when re-expanded after a failure', async () => {
      fetchFileAsObjectUrlFromUrlMock.mockRejectedValueOnce(new Error('network error'));

      const { rerender } = renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[savedVideoAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      await screen.findByTestId('activitySection-mediaError-5678');

      rerender(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );
      rerender(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[savedVideoAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect(await screen.findByTestId('activitySection-video-5678')).toBeInTheDocument();
      expect(fetchFileAsObjectUrlFromUrlMock).toHaveBeenCalledTimes(2);
    });

    test('fetches the media file as an authenticated blob and renders a native video player with the resulting object url', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[savedVideoAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      const video = await screen.findByTestId('activitySection-video-5678');

      expect(fetchFileAsObjectUrlFromUrlMock).toHaveBeenCalledWith('https://example.com/clip.mp4');
      expect(video.tagName).toBe('VIDEO');
      expect(video).toHaveAttribute('src', 'blob:fake-object-url');
      expect(video).toHaveAttribute('controls');
    });

    test('opens the video fullscreen modal immediately and patches in the object url once the media file has been fetched', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect(mockStoreInstance.getActions()).toHaveLength(0);

      const expandArrowIcon = await screen.findByTestId('expand-arrow-icon');
      await userEvent.click(expandArrowIcon);

      expect(mockStoreInstance.getActions()[0].type).toEqual('ADD_MODAL');
      expect(mockStoreInstance.getActions()[0].payload.mediaType).toEqual('video');
      expect(mockStoreInstance.getActions()[0].payload.src).toBeNull();

      expect(fetchFileAsObjectUrlFromUrlMock).toHaveBeenCalledWith('https://example.com/clip.mp4');

      await waitFor(() => {
        expect(mockStoreInstance.getActions()[1].type).toEqual('UPDATE_MODAL');
        expect(mockStoreInstance.getActions()[1].payload.src).toEqual('blob:fake-object-url');
        expect(mockStoreInstance.getActions()[1].payload.id).toEqual(mockStoreInstance.getActions()[0].payload.id);
      });
    });

    test('patches the fullscreen modal with a fetch error if the media fetch fails', async () => {
      fetchFileAsObjectUrlFromUrlMock.mockRejectedValue(new Error('network error'));

      renderWithWrapper(
        <AttachmentListItem attachment={savedVideoAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      const expandArrowIcon = await screen.findByTestId('expand-arrow-icon');
      await userEvent.click(expandArrowIcon);

      await waitFor(() => {
        expect(mockStoreInstance.getActions()[1].type).toEqual('UPDATE_MODAL');
        expect(mockStoreInstance.getActions()[1].payload.fetchError).toBe(true);
        expect(mockStoreInstance.getActions()[1].payload.id).toEqual(mockStoreInstance.getActions()[0].payload.id);
      });
    });
  });

  describe('audio attachments', () => {
    const savedAudioAttachment = {
      file_type: 'audio',
      id: '9012',
      filename: 'interview.m4a',
      updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
      url: 'https://example.com/interview.m4a',
    };

    test('is collapsible', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedAudioAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect((await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'))))
        .toHaveLength(1);
    });

    test('does not fetch the media file until the row is expanded', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedAudioAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      await screen.findByText('interview.m4a');

      expect(fetchFileAsObjectUrlFromUrlMock).not.toHaveBeenCalled();
    });

    test('fetches the media file as an authenticated blob and renders a native audio player with the resulting object url', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedAudioAttachment} cardsExpanded={[savedAudioAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      const audio = await screen.findByTestId('activitySection-audio-9012');

      expect(fetchFileAsObjectUrlFromUrlMock).toHaveBeenCalledWith('https://example.com/interview.m4a');
      expect(audio.tagName).toBe('AUDIO');
      expect(audio).toHaveAttribute('src', 'blob:fake-object-url');
      expect(audio).toHaveAttribute('controls');
    });

    test('does not show a fullscreen expand button', async () => {
      renderWithWrapper(
        <AttachmentListItem attachment={savedAudioAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      await screen.findByText('interview.m4a');

      expect(screen.queryByTestId('expand-arrow-icon')).not.toBeInTheDocument();
    });

    test('shows an error message instead of the player if the media fetch fails', async () => {
      fetchFileAsObjectUrlFromUrlMock.mockRejectedValue(new Error('network error'));

      renderWithWrapper(
        <AttachmentListItem attachment={savedAudioAttachment} cardsExpanded={[savedAudioAttachment]} onCollapse={onCollapse} onExpand={onExpand} />
      );

      expect(await screen.findByTestId('activitySection-mediaError-9012')).toHaveTextContent('Unable to load this file.');
      expect(screen.queryByTestId('activitySection-audio-9012')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activitySection-mediaLoading-9012')).not.toBeInTheDocument();
    });
  });
});
