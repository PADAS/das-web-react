import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
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

describe('DetailView - ActivitySection', () => {
  const onDeleteAttachment = jest.fn(), onDeleteNote = jest.fn(), onNewNoteHasChanged = jest.fn(), onSaveNote = jest.fn();

  const containedReports = patrols[2].patrol_segments[0].events;
  const currentDate = new Date();
  const defaultProps = {
    attachments: files,
    attachmentsToAdd: [{
      creationDate: new Date(currentDate.getTime() + 1).toISOString(),
      file: { name: 'newFile1.pdf' },
    }, {
      creationDate: new Date(currentDate.getTime() + 2).toISOString(),
      file: { name: 'newFile2.pdf' },
    }],
    containedReports,
    endTime: new Date(2022, 6, 15),
    notes: [
      ...notes,
      {
        updated_at: new Date(2022, 6, 15).toISOString(),
        text: 'note1',
      }
    ],
    notesToAdd: [{
      creationDate: new Date(currentDate.getTime() + 3).toISOString(),
      text: 'noteToAdd1',
    }, {
      creationDate: new Date(currentDate.getTime() + 4).toISOString(),
      text: 'noteToAdd2',
    }],
    onDeleteAttachment,
    onDeleteNote,
    onNewNoteHasChanged,
    onSaveNote,
    startTime: new Date(2022, 6, 9),
  };

  const initialStore = {
    data: { eventSchemas: {}, eventStore: {}, eventTypes: [], patrolTypes: [] },
    view: {}
  };

  const renderActivitySection = (props = defaultProps) => render(
    <Provider store={mockStore(initialStore)}>
      <NavigationWrapper>
        <TrackerContext.Provider value={{ track: jest.fn() }}>
          <ActivitySection {...props} />
        </TrackerContext.Provider>
      </NavigationWrapper>
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('expands a contained report when clicking the down arrow', async () => {
    renderActivitySection();

    const { id } = containedReports[0];
    const reportCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    expect(reportCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('show');
    });
  });

  test('collapses a contained report when clicking the up arrow', async () => {
    renderActivitySection();

    const { id } = containedReports[0];

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`activitySection-arrowUp-${id}`);
    userEvent.click(collapseButton);

    const reportCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('collapse');
    });
  });

  test('expands an existing image attachment when clicking the down arrow', async () => {
    renderActivitySection();

    const [, imageAttachment ] = files;
    const { id } = imageAttachment;
    const imageCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    expect(imageCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing image attachment when clicking the up arrow', async () => {
    renderActivitySection();

    const [, imageAttachment ] = files;
    const { id } = imageAttachment;

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`activitySection-arrowUp-${id}`);
    userEvent.click(collapseButton);

    const imageCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('collapse');
    });
  });

  test('removes new attachment from attachments to add when clicking the delete icon', async () => {
    renderActivitySection();

    expect(onDeleteAttachment).toHaveBeenCalledTimes(0);

    const deleteNewAttachmentButton = await screen.findByTestId('activitySection-trashCan-newFile1.pdf');
    userEvent.click(deleteNewAttachmentButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
  });

  test('expands an existing note when clicking the down arrow', async () => {
    renderActivitySection();

    const [ note ] = notes;
    const { id: noteId } = note;
    const noteCollapse = await screen.findByTestId(`activitySection-collapse-${noteId}`);

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${noteId}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing note when clicking the up arrow', async () => {
    renderActivitySection();

    const [ note ] = notes;
    const { id: noteId } = note;
    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${noteId}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`activitySection-arrowUp-${noteId}`);
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId(`activitySection-collapse-${noteId}`);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('saves an existing edited note', async () => {
    renderActivitySection();

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
    renderActivitySection();

    const noteCollapse = await screen.findByTestId('activitySection-collapse-noteToAdd1');

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId('activitySection-arrowDown-noteToAdd1');
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses a new note when clicking the up arrow', async () => {
    renderActivitySection();

    const expandButton = await screen.findByTestId('activitySection-arrowDown-noteToAdd1');
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId('activitySection-arrowUp-noteToAdd1');
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId('activitySection-collapse-noteToAdd1');

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('deletes a new note when clicking the trash button', async () => {
    renderActivitySection();

    expect(onDeleteNote).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('activitySection-deleteIcon-noteToAdd1');
    userEvent.click(deleteButton);

    expect(onDeleteNote).toHaveBeenCalledTimes(1);
  });

  test('saves a new edited note', async () => {
    renderActivitySection();

    expect(onSaveNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId('activitySection-editIcon-noteToAdd1');
    userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId('activitySection-noteTextArea-noteToAdd1');
    userEvent.type(noteTextArea, 'edited');
    const saveNoteButton = await screen.findByText('Done');
    userEvent.click(saveNoteButton);

    expect(onSaveNote).toHaveBeenCalledTimes(1);
    expect(onSaveNote.mock.calls[0][1].text).toBe('noteToAdd1edited');
  });

  test('sorts items by date', async () => {
    renderActivitySection();

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('noteToAdd2'))).toBeDefined();
    expect((await within(items[1]).findAllByText('noteToAdd1'))).toBeDefined();
    expect((await within(items[2]).findAllByText('newFile2.pdf'))).toBeDefined();
    expect((await within(items[3]).findAllByText('newFile1.pdf'))).toBeDefined();
    expect((await within(items[4]).findAllByText('note1'))).toBeDefined();
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    renderActivitySection();

    const timeSortButton = await screen.findByTestId('time-sort-btn');
    userEvent.click(timeSortButton);

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('155027'))).toBeDefined();
    expect((await within(items[1]).findAllByText('155027'))).toBeDefined();
    expect((await within(items[2]).findAllByText('155884'))).toBeDefined();
    expect((await within(items[3]).findAllByText('155884'))).toBeDefined();
    expect((await within(items[4]).findAllByText('file1.pdf'))).toBeDefined();
  });

  test('expands all expandable items when clicking the button Expand All', async () => {
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });
  });

  test('collapses all expandable items when clicking the button Collapse All', async () => {
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');
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
    renderActivitySection();

    expect((await screen.findByText('Expand All'))).toBeDefined();
    expect((await screen.findByTestId('time-sort-btn'))).toBeDefined();
  });

  test('hides activity action buttons if items list is empty', async () => {
    renderActivitySection({
      ...defaultProps,
      attachments: [],
      containedReports: [],
      notes: [],
      notesToAdd: [],
    });

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('time-sort-btn'))).toBeNull();
  });
});
