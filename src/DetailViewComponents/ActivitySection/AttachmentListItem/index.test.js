import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { TrackerContext } from '../../../utils/analytics';

import { downloadFileFromUrl } from '../../../utils/download';
import { fetchImageAsBase64FromUrl } from '../../../utils/file';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../../test-utils';

import AttachmentListItem from '.';

jest.mock('../../../utils/download', () => ({
  ...jest.requireActual('../../../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

jest.mock('../../../utils/file', () => ({
  ...jest.requireActual('../../../utils/file'),
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
  let downloadFileFromUrlMock, fetchImageAsBase64FromUrlMock, store, mockStoreInstance;
  beforeEach(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);
    fetchImageAsBase64FromUrlMock = jest.fn();
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

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

  test('italicizes the title of an attachment that is not saved yet', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
    );

    const title = await screen.findByText('file.txt');

    expect(title).toHaveClass('unsaved');
  });

  test('does not italicize the title of a saved attachment', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={{ filename: 'file.txt', id: '1234', url: '/file.txt' }} />
    );

    expect(await screen.findByText('file.txt')).not.toHaveClass('unsaved');
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

  test('exposes an accessible name and title on the download button', async () => {
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

    const downloadButton = (await screen.findByTestId('activitySection-downloadArrow-1234')).closest('button');
    expect(downloadButton).toHaveAccessibleName('Download file.txt');
    expect(downloadButton).toHaveAttribute('title', 'Download file.txt');
  });

  test('exposes an accessible name and title on the delete button', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
    );

    const deleteButton = (await screen.findByTestId('activitySection-trashCan-file.txt')).closest('button');
    expect(deleteButton).toHaveAccessibleName('Delete file.txt');
    expect(deleteButton).toHaveAttribute('title', 'Delete file.txt');
  });

  test('saved images are collapsibles', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect((await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'))))
      .toHaveLength(1);
  });

  test('fetches the different image sizes for saved images', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledTimes(3);
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('icon');
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('original');
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('thumbnail');
  });

  test('falls back to the generic icon and reports the failure if the image download fails', async () => {
    const onUnhandledRejection = jest.fn();
    process.on('unhandledRejection', onUnhandledRejection);

    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fetchImageAsBase64FromUrlMock = jest.fn(() => Promise.reject(new Error('The url expired')));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', onUnhandledRejection);

    expect(onUnhandledRejection).toHaveBeenCalledTimes(0);
    expect(consoleWarn).toHaveBeenCalled();
    expect(document.querySelector('.attachmentThumbnail')).toBeNull();
    expect((await screen.findByRole('img', { name: 'file.txt preview' }))).not.toHaveAttribute('src');
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
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
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
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
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
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
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
          isOpen={true}
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

  test('user can click anywhere on the row to open the image collapsible', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(onExpand).toHaveBeenCalledTimes(0);

    const title = await screen.findByText('file.txt');
    await userEvent.click(title);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('does not toggle the image collapsible when pressing the full screen button', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const expandArrowIcon = await screen.findByTestId('expand-arrow-icon');
    await userEvent.click(expandArrowIcon);

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect(onCollapse).toHaveBeenCalledTimes(0);
  });

  test('exposes an accessible name and title on the image row buttons', async () => {
    const { rerender } = renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const fullScreenButton = (await screen.findByTestId('expand-arrow-icon')).closest('button');
    expect(fullScreenButton).toHaveAccessibleName('Show file.txt in full screen');
    expect(fullScreenButton).toHaveAttribute('title', 'Show file.txt in full screen');

    const expandButton = (await screen.findByTestId('activitySection-arrowDown-1234')).closest('button');
    expect(expandButton).toHaveAccessibleName('Expand file.txt');
    expect(expandButton).toHaveAttribute('title', 'Expand file.txt');

    rerender(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={true} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const collapseButton = (await screen.findByTestId('activitySection-arrowUp-1234')).closest('button');
    expect(collapseButton).toHaveAccessibleName('Collapse file.txt');
    expect(collapseButton).toHaveAttribute('title', 'Collapse file.txt');
  });

  test('exposes aria-expanded on the collapse toggle button', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const arrowIcon = await screen.findByTestId('activitySection-arrowDown-1234');
    expect(arrowIcon.closest('button')).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens the fullscreen mode when pressing the image expanded', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandedImage = await screen.findByRole('img', { name: 'file.txt preview' });
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
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const expandedImage = await screen.findByRole('img', { name: 'file.txt preview' });

    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'thumbnail');
    });

    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'original');
    });
  });

  test('does not put the expanded image in the tab order', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const expandedImage = await screen.findByRole('img', { name: 'file.txt preview' });

    expect(expandedImage).not.toHaveAttribute('tabindex');
  });

  test('hides the previous image while the image url changes and the new one is still loading', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => url === 'slow-icon'
      ? new Promise(() => {})
      : Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    const { rerender } = renderWithWrapper(
      <AttachmentListItem attachment={savedImageAttachment} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    await waitFor(() => {
      expect(document.querySelector('.attachmentThumbnail')).toHaveAttribute('src', 'icon');
    });

    const attachmentWithSlowIcon = { ...savedImageAttachment, images: { ...savedImageAttachment.images, icon: 'slow-icon' } };
    rerender(
      <AttachmentListItem attachment={attachmentWithSlowIcon} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    await waitFor(() => {
      expect(document.querySelector('.attachmentThumbnail')).toBeNull();
    });
  });

  test('ignores a stale image response if the image url changes before it resolves', async () => {
    let resolveSlowOriginal;
    fetchImageAsBase64FromUrlMock = jest.fn((url) => {
      if (url === 'slow-original') {
        return new Promise((resolve) => { resolveSlowOriginal = resolve; });
      }
      return Promise.resolve(url);
    });
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    const attachmentWithSlowOriginal = { ...savedImageAttachment, images: { ...savedImageAttachment.images, original: 'slow-original' } };
    const { rerender } = renderWithWrapper(
      <AttachmentListItem attachment={attachmentWithSlowOriginal} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const attachmentWithFastOriginal = { ...savedImageAttachment, images: { ...savedImageAttachment.images, original: 'fast-original' } };
    rerender(
      <AttachmentListItem attachment={attachmentWithFastOriginal} isOpen={false} onCollapse={onCollapse} onExpand={onExpand} />
    );

    const expandedImage = await screen.findByRole('img', { name: 'file.txt preview' });
    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'fast-original');
    });

    resolveSlowOriginal('slow-original');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(expandedImage).toHaveAttribute('src', 'fast-original');
  });
});
