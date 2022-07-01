import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { downloadFileFromUrl } from '../../../utils/download';
import { fetchImageAsBase64FromUrl } from '../../../utils/file';
import { mockStore } from '../../../__test-helpers/MockStore';

import AttachmentListItem from '.';

jest.mock('../../../utils/download', () => ({
  ...jest.requireActual('../../../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

jest.mock('../../../utils/file', () => ({
  ...jest.requireActual('../../../utils/file'),
  fetchImageAsBase64FromUrl: jest.fn(),
}));

describe('ReportDetailView - ActivitySection - AttachmentListItem', () => {
  const savedImageAttachment = {
    file_type: 'image',
    id: '1234',
    images: { icon: 'icon', original: 'original', thumbnail: 'thumbnail' },
    filename: 'file.txt',
    updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
  };
  const onCollapse = jest.fn(), onDelete = jest.fn(), onExpand = jest.fn(), track = jest.fn();
  let downloadFileFromUrlMock, fetchImageAsBase64FromUrlMock, store;
  beforeEach(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);
    fetchImageAsBase64FromUrlMock = jest.fn();
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    store = { data: {}, view: { fullScreenImage: {} } };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sets the filename as the title if it is defined', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
          reportTracker={{ track }}
        />
      </Provider>
    );

    const title = await screen.findByText('file.txt');

    expect(title).toBeDefined();
    expect(title).toHaveClass('itemTitle');
  });

  test('sets the name as the title if a filename is not defined', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
      </Provider>
    );

    const title = await screen.findByText('file.txt');

    expect(title).toBeDefined();
    expect(title).toHaveClass('itemTitle');
  });

  test('shows the last update time if it is an existing attachment', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
          reportTracker={{ track }}
        />
      </Provider>
    );

    expect((await screen.findByTestId('reportDetailView-activitySection-dateTime-1234'))).toBeDefined();
  });

  test('user can download existing attachments', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
          reportTracker={{ track }}
        />
      </Provider>
    );

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(0);

    const downloadButton = await screen.findByText('download-arrow.svg');
    userEvent.click(downloadButton);

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(1);
    expect(downloadFileFromUrl).toHaveBeenCalledWith('/file.txt', { filename: 'file.txt' });
  });

  test('user can not delete existing attachments', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem
          attachment={{
            filename: 'file.txt',
            id: '1234',
            url: '/file.txt',
            updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
          }}
          reportTracker={{ track }}
        />
      </Provider>
    );

    expect((await screen.queryByText('trash-can.svg'))).toBeNull();
  });

  test('user can not download new attachments', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
      </Provider>
    );

    expect((await screen.queryByText('download-arrow.svg'))).toBeNull();
  });

  test('user can delete new attachments', async () => {
    const attachment = { name: 'file.txt' };
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={attachment} onDelete={onDelete} />
      </Provider>
    );

    expect(onDelete).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('saved images are collapsibles', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect((await screen.findAllByTestId((content) => content.startsWith('reportDetailView-activitySection-collapse'))))
      .toHaveLength(1);
  });

  test('fetches the different image sizes for saved images', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledTimes(3);
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('icon');
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('original');
    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledWith('thumbnail');
  });

  test('does not render collapsibles nor fetches images for non saved images', async () => {
    const attachment = { name: 'file.png' };
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={attachment} onDelete={onDelete} />
      </Provider>
    );

    expect(fetchImageAsBase64FromUrlMock).toHaveBeenCalledTimes(0);
    expect((await screen.queryAllByTestId((content) => content.startsWith('reportDetailView-activitySection-collapse'))))
      .toHaveLength(0);
  });

  test('opens the original of an existing image in fullscreen when pressing the expand icon', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandArrowIcon = await screen.findByText('expand-arrow.svg');
    userEvent.click(expandArrowIcon);

    expect(mockStoreInstance.getActions()).toHaveLength(1);
    expect(mockStoreInstance.getActions()).toEqual([{
      payload: { file: savedImageAttachment, source: 'original' },
      type: 'SET_FULL_SCREEN_IMAGE_DATA',
    }]);
  });

  test('opens the thumbnail of an existing image in fullscreen when pressing the expand icon if the original is not loaded yet', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => url === 'original' ? undefined : Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandArrowIcon = await screen.findByText('expand-arrow.svg');
    userEvent.click(expandArrowIcon);

    expect(mockStoreInstance.getActions()).toHaveLength(1);
    expect(mockStoreInstance.getActions()).toEqual([{
      payload: { file: savedImageAttachment, source: 'thumbnail' },
      type: 'SET_FULL_SCREEN_IMAGE_DATA',
    }]);
  });

  test('user can open the image collapsible', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect(onExpand).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('reportDetailView-activitySection-collapse-1234'))).toHaveClass('collapse');

    const expandAttachmentButton = await screen.findByText('arrow-down-simple.svg');
    userEvent.click(expandAttachmentButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  test('user can close the image collapsible', async () => {
    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem
          attachment={savedImageAttachment}
          cardsExpanded={[savedImageAttachment]}
          onCollapse={onCollapse}
          onExpand={onExpand}
        />
      </Provider>
    );

    expect(onCollapse).toHaveBeenCalledTimes(0);
    expect((await screen.findByTestId('reportDetailView-activitySection-collapse-1234'))).toHaveClass('show');

    const colapseAttachmentButton = await screen.findByText('arrow-up-simple.svg');
    userEvent.click(colapseAttachmentButton);

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('opens the fullscreen mode when pressing the image expanded', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toHaveLength(0);

    const expandedImage = await screen.findByRole('img');
    userEvent.click(expandedImage);

    expect(mockStoreInstance.getActions()).toHaveLength(1);
    expect(mockStoreInstance.getActions()).toEqual([{
      payload: { file: savedImageAttachment, source: 'original' },
      type: 'SET_FULL_SCREEN_IMAGE_DATA',
    }]);
  });

  test('replaces the fullscreen mode image with the original once it is loaded', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => url === 'original'
      ? new Promise((resolve) => setTimeout(() => resolve(url), 50))
      : Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    store.view.fullScreenImage = { file: savedImageAttachment, source: 'thumbnail' };
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toHaveLength(1);

    await waitFor(() => {
      expect(mockStoreInstance.getActions()).toHaveLength(2);
      expect(mockStoreInstance.getActions()[1]).toEqual({
        payload: { file: savedImageAttachment, source: 'original' },
        type: 'SET_FULL_SCREEN_IMAGE_DATA',
      });
    });
  });

  test('replaces the expanded image with the original once it is loaded', async () => {
    fetchImageAsBase64FromUrlMock = jest.fn((url) => url === 'original'
      ? new Promise((resolve) => setTimeout(() => resolve(url), 50))
      : Promise.resolve(url));
    fetchImageAsBase64FromUrl.mockImplementation(fetchImageAsBase64FromUrlMock);

    render(
      <Provider store={mockStore(store)}>
        <AttachmentListItem attachment={savedImageAttachment} cardsExpanded={[]} onCollapse={onCollapse} onExpand={onExpand} />
      </Provider>
    );

    const expandedImage = await screen.findByRole('img');

    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'thumbnail');
    });

    await waitFor(() => {
      expect(expandedImage).toHaveAttribute('src', 'original');
    });
  });
});
