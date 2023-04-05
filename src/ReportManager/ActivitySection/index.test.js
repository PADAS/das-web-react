import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { EVENT_API_URL } from '../../ducks/events';
import { EVENT_TYPE_SCHEMA_API_URL } from '../../ducks/event-schemas';
import { files, notes, report } from '../../__test-helpers/fixtures/reports';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';

import { TrackerContext } from '../../utils/analytics';

import ActivitySection from './';

jest.mock('../../utils/file', () => ({
  ...jest.requireActual('../../utils/file'),
  fetchImageAsBase64FromUrl: jest.fn(),
}));

const server = setupServer(
  rest.get(
    `${EVENT_API_URL}:eventId`,
    (req, res, ctx) => res(ctx.json( { data: { ...report } }))
  ),
  rest.get(
    `${EVENT_TYPE_SCHEMA_API_URL}:name`,
    (req, res, ctx) => res(ctx.json( { data: { results: {} } }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportManager - ActivitySection', () => {
  const onDeleteAttachment = jest.fn(), onDeleteNote= jest.fn(), onSaveNote= jest.fn(), track = jest.fn();
  let store;
  beforeEach(() => {
    store = { data: { eventSchemas: {}, eventStore: {}, eventTypes: [], patrolTypes: [] }, view: {} };

    const currentDate = new Date();
    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <ActivitySection
            attachmentsToAdd={[{
              creationDate: new Date(currentDate.getTime() + 1).toISOString(),
              file: { name: 'newFile1.pdf' },
            }, {
              creationDate: new Date(currentDate.getTime() + 2).toISOString(),
              file: { name: 'newFile2.pdf' },
            }]}
            containedReports={[report]}
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
          />
          </TrackerContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('expands a contained report when clicking the down arrow', async () => {
    const reportCollapse = await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');

    expect(reportCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId('activitySection-arrowDown-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('show');
    });
  });

  test('collapses a contained report when clicking the up arrow', async () => {
    const expandButton = await screen.findByTestId('activitySection-arrowDown-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId('activitySection-arrowUp-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');
    userEvent.click(collapseButton);

    const reportCollapse = await screen.findByTestId('activitySection-collapse-d45cb504-4612-41fe-9ea5-f1b423ac3ba4');

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('collapse');
    });
  });

  test('expands an existing image attachment when clicking the down arrow', async () => {
    const imageCollapse = await screen.findByTestId('activitySection-collapse-b1a3951e-20b7-4516-b0a2-df6f3e4bde21');

    expect(imageCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId('activitySection-arrowDown-b1a3951e-20b7-4516-b0a2-df6f3e4bde21');
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing image attachment when clicking the up arrow', async () => {
    const expandButton = await screen.findByTestId('activitySection-arrowDown-b1a3951e-20b7-4516-b0a2-df6f3e4bde21');
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId('activitySection-arrowUp-b1a3951e-20b7-4516-b0a2-df6f3e4bde21');
    userEvent.click(collapseButton);

    const imageCollapse = await screen.findByTestId('activitySection-collapse-b1a3951e-20b7-4516-b0a2-df6f3e4bde21');

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('collapse');
    });
  });

  test('removes new attachment from attachments to add when clicking the delete icon', async () => {
    expect(onDeleteAttachment).toHaveBeenCalledTimes(0);

    const deleteNewAttachmentButton = await screen.findByTestId('activitySection-trashCan-newFile1.pdf');
    userEvent.click(deleteNewAttachmentButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
  });

  test('expands an existing note when clicking the down arrow', async () => {
    const noteCollapse = await screen.findByTestId('activitySection-collapse-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId('activitySection-arrowDown-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing note when clicking the up arrow', async () => {
    const expandButton = await screen.findByTestId('activitySection-arrowDown-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId('activitySection-arrowUp-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId('activitySection-collapse-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('saves an existing edited note', async () => {
    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('activitySection-editIcon-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('activitySection-noteTextArea-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Done');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1].text).toBe('note4edited');
  });

  test('expands a new note when clicking the down arrow', async () => {
    const noteCollapse = await screen.findByTestId('activitySection-collapse-note1');

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId('activitySection-arrowDown-note1');
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses a new note when clicking the up arrow', async () => {
    const expandButton = await screen.findByTestId('activitySection-arrowDown-note1');
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId('activitySection-arrowUp-note1');
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId('activitySection-collapse-note1');

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('deletes a new note when clicking the trash button', async () => {
    expect(onDeleteNote).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('activitySection-deleteIcon-note1');
    userEvent.click(deleteButton);

    expect(onDeleteNote).toHaveBeenCalledTimes(1);
  });

  test('saves a new edited note', async () => {
    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('activitySection-editIcon-note1');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('activitySection-noteTextArea-note1');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Done');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1].text).toBe('note1edited');
  });

  test('sorts items by date', async () => {
    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('New note: note2'))).toBeDefined();
    expect((await within(items[2]).findAllByText('newFile2.pdf'))).toBeDefined();
    expect((await within(items[4]).findAllByText('note4'))).toBeDefined();
    expect((await within(items[6]).findAllByText('file1.png'))).toBeDefined();
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    const timeSortButton = await screen.findByTestId('time-sort-btn');
    userEvent.click(timeSortButton);

    const items = await screen.findAllByRole('listitem');

    await waitFor(() => {
      expect((within(items[0]).findAllByText('note4'))).toBeDefined();
      expect((within(items[2]).findAllByText('light_rep'))).toBeDefined();
      expect((within(items[4]).findAllByText('file1.pdf'))).toBeDefined();
      expect((within(items[6]).findAllByText('file1.png'))).toBeDefined();
    });
  });

  test('expands all expandable items when clicking the button Expand All', async () => {
    const expandCollapseButton = await screen.findByTestId('reportManager-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });
  });

  test('collapses all expandable items when clicking the button Collapse All', async () => {
    const expandCollapseButton = await screen.findByTestId('reportManager-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'));

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
    expect((await screen.findByTestId('time-sort-btn'))).toBeDefined();
  });

  test('hides activity action buttons if items list is empty', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <ActivitySection
          attachmentsToAdd={[]}
          containedReports={[]}
          notesToAdd={[]}
          onDeleteAttachment={onDeleteAttachment}
          onDeleteNote={onDeleteNote}
          onSaveNote={onSaveNote}
          reportAttachments={[]}
          reportNotes={[]}
          reportTracker={{ track }}
        />
      </Provider>
    );

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('time-sort-btn'))).toBeNull();
  });
});
