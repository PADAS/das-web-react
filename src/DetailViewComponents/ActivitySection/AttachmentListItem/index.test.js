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

    const downloadButton = await screen.findByText('download-arrow.svg');
    userEvent.click(downloadButton);

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

    expect((await screen.queryByText('trash-can.svg'))).toBeNull();
  });

  test('user can not download new attachments', async () => {
    renderWithWrapper(
      <AttachmentListItem attachment={{ name: 'file.txt' }} onDelete={onDelete} />
    );

    expect((await screen.queryByText('download-arrow.svg'))).toBeNull();
  });

  test('user can delete new attachments', async () => {
    const attachment = { name: 'file.txt' };
    renderWithWrapper(
      <AttachmentListItem attachment={attachment} onDelete={onDelete} />
    );

    expect(onDelete).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByText('trash-can.svg');
    userEvent.click(deleteButton);

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

    const expandArrowIcon = await screen.findByText('expand-arrow.svg');
    userEvent.click(expandArrowIcon);

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

    const expandArrowIcon = await screen.findByText('expand-arrow.svg');
    userEvent.click(expandArrowIcon);

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

    const expandAttachmentButton = await screen.findByText('arrow-down-simple.svg');
    userEvent.click(expandAttachmentButton);

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

    const colapseAttachmentButton = await screen.findByText('arrow-up-simple.svg');
    userEvent.click(colapseAttachmentButton);

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
    userEvent.click(expandedImage);

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
});
