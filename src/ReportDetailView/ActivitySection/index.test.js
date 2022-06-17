import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { files, notes } from '../../__test-helpers/fixtures/reports';

import ActivitySection from './';

describe('ReportDetailView - ActivitySection', () => {
  const onDeleteAttachment = jest.fn(), onDeleteNote= jest.fn(), onSaveNote= jest.fn(), track = jest.fn();
  beforeEach(() => {
    const currentDate = new Date();
    render(<ActivitySection
      attachmentsToAdd={[{
        creationDate: new Date(currentDate.getTime() + 1).toISOString(),
        file: { name: 'newFile1.pdf' },
      }, {
        creationDate: new Date(currentDate.getTime() + 2).toISOString(),
        file: { name: 'newFile2.pdf' },
      }]}
      notesToAdd={[{
        creationDate: new Date(currentDate.getTime() + 3).toISOString(),
        text: 'note1',
      }, {
        creationDate: new Date(currentDate.getTime() + 4).toISOString(),
        text: 'note2',
      }]}
      onDeleteAttachment={onDeleteAttachment}
      onDeleteNote={onDeleteNote}
      onSaveNote={onSaveNote}
      reportAttachments={files}
      reportNotes={notes}
      reportTracker={{ track }}
    />);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('removes new attachment from attachments to add when clicking the delete icon', async () => {
    expect(onDeleteAttachment).toHaveBeenCalledTimes(0);

    const deleteNewAttachmentButton = (await screen.findAllByText('trash-can.svg'))[0];
    userEvent.click(deleteNewAttachmentButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
  });

  test('expands an existing note when clicking the down arrow', async () => {
    const noteCollapse = await screen.findByTestId('reportDetailView-activitySection-collapse-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = (await screen.findAllByText('arrow-down-small.svg'))[0];
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing note when clicking the up arrow', async () => {
    const expandButton = (await screen.findAllByText('arrow-down-small.svg'))[0];
    userEvent.click(expandButton);
    const collapseButton = (await screen.findAllByText('arrow-up-small.svg'))[0];
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId('reportDetailView-activitySection-collapse-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('saves an existing edited note', async () => {
    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('reportDetailView-activitySection-editIcon-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('reportDetailView-activitySection-noteTextArea-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Save Note');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1]).toBe('note4edited');
  });

  test('expands a new note when clicking the down arrow', async () => {
    const noteCollapse = await screen.findByTestId('reportDetailView-activitySection-collapse-note1');

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = (await screen.findAllByText('arrow-down-small.svg'))[2];
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses a new note when clicking the up arrow', async () => {
    const expandButton = (await screen.findAllByText('arrow-down-small.svg'))[2];
    userEvent.click(expandButton);
    const collapseButton = (await screen.findAllByText('arrow-up-small.svg'))[0];
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId('reportDetailView-activitySection-collapse-note1');

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('deletes a new note when clicking the trash button', async () => {
    expect(onDeleteNote).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('reportDetailView-activitySection-deleteIcon-note1');
    userEvent.click(deleteButton);

    expect(onDeleteNote).toHaveBeenCalledTimes(1);
  });

  test('saves a new edited note', async () => {
    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('reportDetailView-activitySection-editIcon-note1');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('reportDetailView-activitySection-noteTextArea-note1');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Save Note');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1]).toBe('note1edited');
  });

  test('sorts items by date', async () => {
    const itemsText = (await screen.findAllByRole('listitem')).map((item) => item.textContent.split(' ')[0]);

    expect(itemsText).toEqual([
      'note.svgnote49',
      'note.svgnote38',
      'attachment.svgfile1.pdf6',
      'attachment.svgfile2.pdf7',
      'attachment.svgnewFile1.pdftrash-can.svg',
      'attachment.svgnewFile2.pdftrash-can.svg',
      'note.svgNew',
      'note.svgNew',
    ]);
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    const timeSortButton = await screen.findByTestId('reportDetailView-activitySection-timeSortButton');
    userEvent.click(timeSortButton);

    const itemsText = (await screen.findAllByRole('listitem')).map((item) => item.textContent.split(' ')[0]);

    expect(itemsText).toEqual([
      'note.svgNew',
      'note.svgNew',
      'attachment.svgnewFile2.pdftrash-can.svg',
      'attachment.svgnewFile1.pdftrash-can.svg',
      'note.svgnote49',
      'note.svgnote38',
      'attachment.svgfile2.pdf7',
      'attachment.svgfile1.pdf6',
    ]);
  });

  test('expands all expandable items when clicking the button Expand All', async () => {
    const expandCollapseButton = await screen.findByTestId('reportDetailView-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('reportDetailView-activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });
  });

  test('collapses all expandable items when clicking the button Collapse All', async () => {
    const expandCollapseButton = await screen.findByTestId('reportDetailView-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('reportDetailView-activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });

    userEvent.click(expandCollapseButton);

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('collapse'));
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
      onDeleteNote={onDeleteNote}
      onSaveNote={onSaveNote}
      reportAttachments={[]}
      reportNotes={[]}
      reportTracker={{ track }}
    />);

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('arrow-down.svg'))).toBeNull();
  });
});
