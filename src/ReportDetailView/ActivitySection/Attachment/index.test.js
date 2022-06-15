import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { downloadFileFromUrl } from '../../../utils/download';

import Attachment from './';

jest.mock('../../../utils/download', () => ({
  ...jest.requireActual('../../../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

describe('ReportDetailView - ActivitySection - Attachment', () => {
  const onDeleteAttachment = jest.fn(), track = jest.fn();
  let downloadFileFromUrlMock;
  beforeEach(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sets the filename as the title if it is defined', async () => {
    render(<Attachment
      attachment={{
        filename: 'file.txt',
        id: '1234',
        url: '/file.txt',
        updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
      }}
      reportTracker={{ track }}
    />);

    const title = await screen.findByText('file.txt');

    expect(title).toBeDefined();
    expect(title).toHaveClass('itemTitle');
  });

  test('sets the name as the title if a filename is not defined', async () => {
    render(<Attachment attachment={{ name: 'file.txt' }} onDeleteAttachment={onDeleteAttachment} />);

    const title = await screen.findByText('file.txt');

    expect(title).toBeDefined();
    expect(title).toHaveClass('itemTitle');
  });

  test('shows the last update time if it is an existing attachment', async () => {
    render(<Attachment
      attachment={{
        filename: 'file.txt',
        id: '1234',
        url: '/file.txt',
        updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
      }}
      reportTracker={{ track }}
    />);

    expect((await screen.findByTestId('reportDetailView-activitySection-dateTime'))).toBeDefined();
  });

  test('does not show a date time if it is a new attachment', async () => {
    render(<Attachment attachment={{ name: 'file.txt' }} onDeleteAttachment={onDeleteAttachment} />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-dateTime'))).toBeNull();
  });

  test('user can download existing attachments', async () => {
    render(<Attachment
      attachment={{
        filename: 'file.txt',
        id: '1234',
        url: '/file.txt',
        updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
      }}
      reportTracker={{ track }}
    />);

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(0);

    const downloadButton = await screen.findByTestId('reportDetailView-activitySection-downloadIcon-1234');
    userEvent.click(downloadButton);

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(1);
    expect(downloadFileFromUrl).toHaveBeenCalledWith('/file.txt', { filename: 'file.txt' });
  });

  test('user can not delete existing attachments', async () => {
    render(<Attachment
      attachment={{
        filename: 'file.txt',
        id: '1234',
        url: '/file.txt',
        updates: [{ time: '2021-11-10T07:26:19.869873-08:00' }],
      }}
      reportTracker={{ track }}
    />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-deleteIcon'))).toBeNull();
  });

  test('user can not download new attachments', async () => {
    render(<Attachment attachment={{ name: 'file.txt' }} onDeleteAttachment={onDeleteAttachment} />);

    expect((await screen.queryByTestId('reportDetailView-activitySection-downloadIcon-file.txt'))).toBeNull();
  });

  test('user can delete new attachments', async () => {
    const attachment = { name: 'file.txt' };
    render(<Attachment attachment={attachment} onDeleteAttachment={onDeleteAttachment} />);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('reportDetailView-activitySection-deleteIcon-file.txt');
    userEvent.click(deleteButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
    expect(onDeleteAttachment).toHaveBeenCalledWith(attachment);
  });
});
