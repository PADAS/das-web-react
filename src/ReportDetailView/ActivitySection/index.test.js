import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
  const onDeleteAttachment = jest.fn(), setNotesToAdd= jest.fn(), setReportNotes= jest.fn(), track = jest.fn();
  beforeEach(() => {
    downloadFileFromUrlMock = jest.fn();
    downloadFileFromUrl.mockImplementation(downloadFileFromUrlMock);

    render(<ActivitySection
      attachmentsToAdd={[{
        creationDate: new Date().toISOString(),
        file: { name: 'newFile1.pdf' },
      }, {
        creationDate: new Date().toISOString(),
        file: { name: 'newFile2.pdf' },
      }]}
      notesToAdd={[{
        creationDate: new Date().toISOString(),
        text: 'note1',
      }, {
        creationDate: new Date().toISOString(),
        text: 'note2',
      }]}
      onDeleteAttachment={onDeleteAttachment}
      reportAttachments={files}
      reportNotes={[{
        text: 'note3',
        id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde19',
        updates: [{ time: '2022-06-08T21:58:48.248635+00:00' }],
      }, {
        text: 'note4',
        id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde20',
        updates: [{ time: '2022-06-09T21:58:48.248635+00:00' }],
      }]}
      reportTracker={{ track }}
      setNotesToAdd={setNotesToAdd}
      setReportNotes={setReportNotes}
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

    const deleteNewAttachmentButton = (await screen.findAllByTestId('reportDetailView-activitySection-deleteIcon-newFile1.pdf'))[0];
    userEvent.click(deleteNewAttachmentButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
  });

  test('sorts items by date', async () => {
    const itemsText = (await screen.findAllByRole('listitem')).map((item) => item.textContent.split(' ')[0]);

    expect(itemsText).toEqual([
      'note.svgnote49',
      'note.svgnote38',
      'attachment.svgfile1.pdf6',
      'attachment.svgfile2.pdf7',
      'note.svg(New',
      'note.svg(New',
      'attachment.svgnewFile2.pdftrash-can.svg',
      'attachment.svgnewFile1.pdftrash-can.svg',
    ]);
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    const timeSortButton = await screen.findByTestId('reportDetailView-activitySection-timeSortButton');
    userEvent.click(timeSortButton);

    const itemsText = (await screen.findAllByRole('listitem')).map((item) => item.textContent.split(' ')[0]);

    expect(itemsText).toEqual([
      'note.svg(New',
      'note.svg(New',
      'attachment.svgnewFile2.pdftrash-can.svg',
      'attachment.svgnewFile1.pdftrash-can.svg',
      'note.svgnote49',
      'note.svgnote38',
      'attachment.svgfile2.pdf7',
      'attachment.svgfile1.pdf6',
    ]);
  });

  test('expands all expandable items when clicking the button Expand All', async () => {
    const expandAllButton = await screen.findByTestId('reportDetailView-activitySection-expandAllButton');
    userEvent.click(expandAllButton);

    const collapses = await screen.findAllByTestId('reportDetailView-activitySection-collapse');

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });
  });

  test('shows activity action buttons if there are items', async () => {
    expect((await screen.findByText('Expand All'))).toBeDefined();
    expect((await screen.findByText('arrow-down.svg'))).toBeDefined();
  });

  test('hides activity action buttons if items list is empty', async () => {
    cleanup();
    render(<ActivitySection
      attachmentsToAdd={[]}
      notesToAdd={[]}
      onDeleteAttachment={onDeleteAttachment}
      reportAttachments={[]}
      reportNotes={[]}
      reportTracker={{ track }}
      setNotesToAdd={setNotesToAdd}
      setReportNotes={setReportNotes}
    />);

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('arrow-down.svg'))).toBeNull();
  });
});
