import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { downloadFileFromUrl } from '../utils/download';
import FullScreenImage from '.';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('../utils/download', () => ({
  ...jest.requireActual('../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

describe('FullScreenImage', () => {
  const file = { filename: 'file', url: 'file.com' };
  let store, downloadFileFromUrlMock;
  beforeAll(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);

    store = { view: { fullScreenImage: { file, source: 'source' } } };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('hides the fullscreen mode when clicking the blurred background', async () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <FullScreenImage />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toEqual([]);

    const background = await screen.findByTestId('fullScreenImage-background');
    userEvent.click(background);

    expect(mockStoreInstance.getActions()).toEqual([{
      payload: { file: null, source: null },
      type: 'SET_FULL_SCREEN_IMAGE_DATA',
    }]);
  });

  test('hides the fullscreen mode when user types escape', async () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <FullScreenImage />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toEqual([]);

    userEvent.keyboard('{Escape}');

    expect(mockStoreInstance.getActions()).toEqual([{
      payload: { file: null, source: null },
      type: 'SET_FULL_SCREEN_IMAGE_DATA',
    }]);
  });

  test('does not hide the fullscreen if user clicks the title or the image', async () => {
    const mockStoreInstance = mockStore(store);
    render(
      <Provider store={mockStoreInstance}>
        <FullScreenImage />
      </Provider>
    );

    expect(mockStoreInstance.getActions()).toEqual([]);

    const title = await screen.findByText('file');
    userEvent.click(title);
    const image = await screen.findByRole('img');
    userEvent.click(image);

    expect(mockStoreInstance.getActions()).toEqual([]);
  });

  test('downloads the attachment if user clicks the download icon', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FullScreenImage />
      </Provider>
    );

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(0);

    const downloadIcon = await screen.findByText('download-arrow.svg');
    userEvent.click(downloadIcon);

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(1);
  });
});
