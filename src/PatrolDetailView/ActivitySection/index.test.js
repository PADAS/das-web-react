
 

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import ActivitySection from './index';
import { EVENT_API_URL } from '../../ducks/events';
import { EVENT_TYPE_SCHEMA_API_URL } from '../../ducks/event-schemas';
import { files, notes, report } from '../../__test-helpers/fixtures/reports';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrols from '../../__test-helpers/fixtures/patrols';
import { TrackerContext } from '../../utils/analytics';

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

describe('PatrolDetailView - ActivitySection', () => {
  const onDeleteNote = jest.fn(), onNewNoteHasChanged = jest.fn(), onSaveNote = jest.fn();

  const containedReports = patrols[2].patrol_segments[0].events;

  const initialProps = {
    containedReports,
    onDeleteNote,
    onNewNoteHasChanged,
    onSaveNote,
    patrolAttachments: files,
    patrolEndTime: new Date(2022, 6, 15),
    patrolNotes: [
      ...notes,
      {
        creationDate: new Date(2022, 6, 15).toISOString(),
        text: 'note1',
      }
    ],
    patrolStartTime: new Date(2022, 6, 9),
  };

  const initialStore = {
    data: {
      eventSchemas: {},
      eventStore: {},
      eventTypes: [],
      patrolTypes: [],
    },
    view: {}
  };

  const renderActivitySection = ({
    containedReports,
    onDeleteNote,
    onNewNoteHasChanged,
    onSaveNote,
    patrolAttachments,
    patrolEndTime,
    patrolNotes,
    patrolStartTime,
  } = initialProps) => {
    return render(
      <Provider store={mockStore(initialStore)}>
        <NavigationWrapper>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <ActivitySection
              containedReports={containedReports}
              onDeleteNote={onDeleteNote}
              onNewNoteHasChanged={onNewNoteHasChanged}
              onSaveNote={onSaveNote}
              patrolAttachments={patrolAttachments}
              patrolEndTime={patrolEndTime}
              patrolNotes={patrolNotes}
              patrolStartTime={patrolStartTime}
            />
          </TrackerContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  };

  beforeEach(() => renderActivitySection());

  test('expands a contained report when clicking the down arrow', async () => {
    const { id } = containedReports[0];
    const reportCollapse = await screen.findByTestId(`patrolDetailView-activitySection-collapse-${id}`);

    expect(reportCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('show');
    });
  });

  test('collapses a contained report when clicking the up arrow', async () => {
    const { id } = containedReports[0];

    const expandButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowUp-${id}`);
    userEvent.click(collapseButton);

    const reportCollapse = await screen.findByTestId(`patrolDetailView-activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('collapse');
    });
  });

  test('expands an existing image attachment when clicking the down arrow', async () => {
    const [, imageAttachment ] = files;
    const { id } = imageAttachment;
    const imageCollapse = await screen.findByTestId(`patrolDetailView-activitySection-collapse-${id}`);

    expect(imageCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing image attachment when clicking the up arrow', async () => {
    const [, imageAttachment ] = files;
    const { id } = imageAttachment;

    const expandButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowUp-${id}`);
    userEvent.click(collapseButton);

    const imageCollapse = await screen.findByTestId(`patrolDetailView-activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('collapse');
    });
  });

  test('expands an existing note when clicking the down arrow', async () => {
    const [ note ] = notes;
    const { id: noteId } = note;
    const noteCollapse = await screen.findByTestId(`patrolDetailView-activitySection-collapse-${noteId}`);

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowDown-${noteId}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing note when clicking the up arrow', async () => {
    const [ note ] = notes;
    const { id: noteId } = note;
    const expandButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowDown-${noteId}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`patrolDetailView-activitySection-arrowUp-${noteId}`);
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId(`patrolDetailView-activitySection-collapse-${noteId}`);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('saves an existing edited note', async () => {
    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('patrolDetailView-activitySection-editIcon-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('patrolDetailView-activitySection-noteTextArea-b1a3951e-20b7-4516-b0a2-df6f3e4bde20');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Done');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1].text).toBe('note4edited');
  });

  test('expands a new note when clicking the down arrow', async () => {
    const noteCollapse = await screen.findByTestId('patrolDetailView-activitySection-collapse-note1');

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId('patrolDetailView-activitySection-arrowDown-note1');
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses a new note when clicking the up arrow', async () => {
    const expandButton = await screen.findByTestId('patrolDetailView-activitySection-arrowDown-note1');
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId('patrolDetailView-activitySection-arrowUp-note1');
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId('patrolDetailView-activitySection-collapse-note1');

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('deletes a new note when clicking the trash button', async () => {
    expect(onDeleteNote).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('patrolDetailView-activitySection-deleteIcon-note1');
    userEvent.click(deleteButton);

    expect(onDeleteNote).toHaveBeenCalledTimes(1);
  });

  test('saves a new edited note', async () => {
    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('patrolDetailView-activitySection-editIcon-note1');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('patrolDetailView-activitySection-noteTextArea-note1');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Done');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1].text).toBe('note1edited');
  });

  test('sorts items by date', async () => {
    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('note1'))).toBeDefined();
    expect((await within(items[1]).findAllByText('note4'))).toBeDefined();
    expect((await within(items[2]).findAllByText('note3'))).toBeDefined();
    expect((await within(items[3]).findAllByText('Ended'))).toBeDefined();
    expect((await within(items[4]).findAllByText('Started'))).toBeDefined();
    expect((await within(items[5]).findAllByText('file1.png'))).toBeDefined();
    expect((await within(items[6]).findAllByText('file2.pdf'))).toBeDefined();
    expect((await within(items[7]).findAllByText('file1.pdf'))).toBeDefined();
    expect((await within(items[8]).findAllByText('155884'))).toBeDefined();
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    const timeSortButton = await screen.findByTestId('time-sort-btn');
    userEvent.click(timeSortButton);

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[2]).findAllByText('155884'))).toBeDefined();
    expect((await within(items[4]).findAllByText('file1.pdf'))).toBeDefined();
    expect((await within(items[5]).findAllByText('file2.pdf'))).toBeDefined();
    expect((await within(items[6]).findAllByText('file1.png'))).toBeDefined();
    expect((await within(items[7]).findAllByText('Started'))).toBeDefined();
    expect((await within(items[8]).findAllByText('Ended'))).toBeDefined();
    expect((await within(items[9]).findAllByText('note3'))).toBeDefined();
    expect((await within(items[10]).findAllByText('note4'))).toBeDefined();
    expect((await within(items[11]).findAllByText('note1'))).toBeDefined();
  });

  test('expands all expandable items when clicking the button Expand All', async () => {
    const expandCollapseButton = await screen.findByTestId('patrolDetailView-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('patrolDetailView-activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });
  });

  test('collapses all expandable items when clicking the button Collapse All', async () => {
    const expandCollapseButton = await screen.findByTestId('patrolDetailView-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('patrolDetailView-activitySection-collapse'));

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
    renderActivitySection({
      ...initialProps,
      patrolNotes: [],
      containedReports: [],
      notesToAdd: [],
      patrolAttachments: []
    });

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('time-sort-btn'))).toBeNull();
  });
});