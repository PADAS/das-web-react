import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { downloadFileFromUrl } from '../../utils/download';
import { files } from '../../__test-helpers/fixtures/reports';

import ActivitySection from './';

jest.mock('../../utils/download', () => ({
  ...jest.requireActual('../../utils/download'),
  downloadFileFromUrl: jest.fn(),
}));

describe('ReportDetailView - ActivitySection', () => {
  let downloadFileFromUrlMock;
  const onDeleteAttachment = jest.fn(), track = jest.fn();
  beforeEach(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);

    render(<ActivitySection
      attachmentsToAdd={[{ name: 'newFile1.pdf' }, { name: 'newFile2.pdf' }]}
      onDeleteAttachment={onDeleteAttachment}
      reportAttachments={files}
      reportTracker={{ track }}
    />);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers downloadFileFromUrl when user clicks the download icon of a report attachment', async () => {
    expect(downloadFileFromUrl).toHaveBeenCalledTimes(0);

    const downloadAttachmentButton = (await screen.findAllByTestId('reportDetailView-activitySection-downloadIcon-b1a3951e-20b7-4516-b0a2-df6f3e4bde17'))[0];
    userEvent.click(downloadAttachmentButton);

    expect(downloadFileFromUrl).toHaveBeenCalledTimes(1);
  });

  test('removes new attachment from attachments to add when clicking the delete icon', async () => {
    expect(onDeleteAttachment).toHaveBeenCalledTimes(0);

    const deleteNewAttachmentButton = (await screen.findAllByTestId('reportDetailView-activitySection-deleteIcon'))[0];
    userEvent.click(deleteNewAttachmentButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
  });

  test('sorts items by date', async () => {
    const itemsText = (await screen.findAllByRole('listitem')).map((item) => item.textContent.split(' ')[0]);

    expect(itemsText).toEqual([
      'attachment.svgfile1.pdf6',
      'attachment.svgfile2.pdf7',
      'attachment.svgnewFile2.pdftrash-can.svg',
      'attachment.svgnewFile1.pdftrash-can.svg',
    ]);
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    const timeSortButton = await screen.findByTestId('reportDetailView-activitySection-timeSortButton');
    userEvent.click(timeSortButton);

    const itemsText = (await screen.findAllByRole('listitem')).map((item) => item.textContent.split(' ')[0]);

    expect(itemsText).toEqual([
      'attachment.svgnewFile2.pdftrash-can.svg',
      'attachment.svgnewFile1.pdftrash-can.svg',
      'attachment.svgfile2.pdf7',
      'attachment.svgfile1.pdf6',
    ]);
  });

  test('shows activity action buttons if there are items', async () => {
    expect((await screen.findByText('Expand All'))).toBeDefined();
    expect((await screen.findByText('arrow-down.svg'))).toBeDefined();
  });

  test('hides activity action buttons if items list is empty', async () => {
    cleanup();
    render(<ActivitySection
      attachmentsToAdd={[]}
      onDeleteAttachment={onDeleteAttachment}
      reportAttachments={[]}
      reportTracker={{ track }}
    />);

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('arrow-down.svg'))).toBeNull();
  });
});
