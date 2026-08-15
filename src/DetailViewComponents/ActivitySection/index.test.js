import React, { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import ActivitySection from './index';
import { EVENT_API_URL } from '../../ducks/events';
import { EVENT_TYPE_SCHEMA_V1_URL } from '../../ducks/event-schemas';
import { files, notes, report } from '../../__test-helpers/fixtures/reports';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { render, screen, waitFor, within } from '../../test-utils';
import { TrackerContext } from '../../utils/analytics';

jest.mock('../../utils/file', () => ({
  ...jest.requireActual('../../utils/file'),
  fetchImageAsBase64FromUrl: jest.fn(),
}));

const server = setupServer(
  http.get(`${EVENT_API_URL}:eventId`, () => HttpResponse.json( { data: { ...report } })),
  http.get(EVENT_TYPE_SCHEMA_V1_URL(':name'), () => HttpResponse.json( { data: { results: {} } }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DetailViewComponents - ActivitySection', () => {
  const onCancelNote = jest.fn(),
    onDeleteAttachment = jest.fn(),
    onDeleteNote = jest.fn(),
    onDoneNote = jest.fn(),
    onChangeNote = jest.fn();

  let store, tracker;
  beforeEach(() => {
    tracker = { track: jest.fn() };
    store = {
      data: {
        eventSchemas: {},
        eventStore: {},
        eventTypes: [],
        patrolTypes: [],
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.READ],
          }
        },
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        },
      },
    };
  });

  const currentDate = new Date();
  const notesToAdd = [{
    creationDate: new Date(currentDate.getTime() + 3).toISOString(),
    text: 'noteToAdd1',
    tmpId: 'noteToAdd1-tmpId',
  }, {
    creationDate: new Date(currentDate.getTime() + 4).toISOString(),
    text: 'noteToAdd2',
    tmpId: 'noteToAdd2-tmpId',
  }];

  const containedReports = patrols[2].patrol_segments[0].events;
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
        id: 'b1a3951e-20b7-4516-b0a2-df6f3e4bde22',
        updated_at: new Date(2022, 6, 15).toISOString(),
        text: 'note1',
      }
    ],
    notesToAdd,
    startTime: new Date(2022, 6, 9),
    onCancelNote,
    onDeleteAttachment,
    onDeleteNote,
    onChangeNote,
    onDoneNote,
  };

  const isUnsavedNoteCollapse = (collapse) => notesToAdd
    .some(({ text }) => collapse.dataset.testid === `activitySection-collapse-${text}`);

  const renderActivitySection = (props = defaultProps) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={tracker}>
        <ActivitySection {...props} />
      </TrackerContext.Provider>
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
    await userEvent.click(expandButton);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('show');
    });
  });

  test('collapses a contained report when clicking the up arrow', async () => {
    renderActivitySection();

    const { id } = containedReports[0];

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    await userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`activitySection-arrowUp-${id}`);
    await userEvent.click(collapseButton);

    const reportCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(reportCollapse).not.toHaveClass('show');
    });
  });

  test('hides contained reports if events are not enabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderActivitySection();

    const { id } = containedReports[0];

    expect((await screen.queryByTestId(`activitySection-collapse-${id}`))).toBeNull();
  });

  test('expands an existing image attachment when clicking the down arrow', async () => {
    renderActivitySection();

    const [, imageAttachment ] = files;
    const { id } = imageAttachment;
    const imageCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    expect(imageCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    await userEvent.click(expandButton);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing image attachment when clicking the up arrow', async () => {
    renderActivitySection();

    const [, imageAttachment ] = files;
    const { id } = imageAttachment;

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${id}`);
    await userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`activitySection-arrowUp-${id}`);
    await userEvent.click(collapseButton);

    const imageCollapse = await screen.findByTestId(`activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(imageCollapse).not.toHaveClass('show');
    });
  });

  test('removes new attachment from attachments to add when clicking the delete icon', async () => {
    renderActivitySection();

    expect(onDeleteAttachment).toHaveBeenCalledTimes(0);

    const deleteNewAttachmentButton = await screen.findByTestId('activitySection-trashCan-newFile1.pdf');
    await userEvent.click(deleteNewAttachmentButton);

    expect(onDeleteAttachment).toHaveBeenCalledTimes(1);
  });

  test('expands an existing note when clicking the down arrow', async () => {
    renderActivitySection();

    const [ note ] = notes;
    const { id: noteId } = note;
    const noteCollapse = await screen.findByTestId(`activitySection-collapse-${noteId}`);

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${noteId}`);
    await userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing note when clicking the up arrow', async () => {
    renderActivitySection();

    const [ note ] = notes;
    const { id: noteId } = note;
    const expandButton = await screen.findByTestId(`activitySection-arrowDown-${noteId}`);
    await userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`activitySection-arrowUp-${noteId}`);
    await userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId(`activitySection-collapse-${noteId}`);

    await waitFor(() => {
      expect(noteCollapse).not.toHaveClass('show');
    });
  });

  test('keeps a note that was never saved expanded, with its collapse toggle disabled', async () => {
    renderActivitySection();

    await waitFor(() => {
      expect(screen.getByTestId('activitySection-collapse-noteToAdd1')).toHaveClass('show');
    });

    expect((await screen.findByTestId('activitySection-arrowUp-noteToAdd1')).closest('button')).toBeDisabled();
  });

  test('does not cancel the edition of a note that was never saved when clicking its row', async () => {
    renderActivitySection();

    await userEvent.click(await screen.findByTestId('activitySection-noteTitle-noteToAdd1'));

    expect(onCancelNote).not.toHaveBeenCalled();
    expect(screen.getByTestId('activitySection-collapse-noteToAdd1')).toHaveClass('show');
  });

  test('cancels the edition of a note when collapsing it', async () => {
    const [note] = notes;
    renderActivitySection();

    await userEvent.click(await screen.findByTestId(`activitySection-editIcon-${note.id}`));
    await userEvent.type(await screen.findByTestId(`activitySection-noteTextArea-${note.id}`), ' with changes');

    expect(onCancelNote).toHaveBeenCalledTimes(0);

    await userEvent.click(await screen.findByTestId(`activitySection-arrowUp-${note.id}`));

    expect(onCancelNote).toHaveBeenCalledWith(note);
  });

  test('deletes a new note when clicking the trash button', async () => {
    renderActivitySection();

    expect(onDeleteNote).toHaveBeenCalledTimes(0);

    const deleteButton = await screen.findByTestId('activitySection-deleteIcon-noteToAdd1');
    await userEvent.click(deleteButton);

    expect(onDeleteNote).toHaveBeenCalledTimes(1);
  });

  test('saves an edited note', async () => {
    const [note] = notesToAdd;
    const { text } = note;
    const updatedText = ' with changes';
    const onDone = jest.fn();
    renderActivitySection({ ...defaultProps, onDone });

    expect(onChangeNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId(`activitySection-editIcon-${text}`);
    await userEvent.click(editNoteIcon);
    const noteTextArea = await screen.findByTestId(`activitySection-noteTextArea-${text}`);
    await userEvent.type(noteTextArea, updatedText);
    expect(onChangeNote).toHaveBeenCalledTimes(updatedText.length);

    const doneNoteButton = await screen.findByTestId(`activitySection-noteDone-${text}`);
    await userEvent.click(doneNoteButton);

    expect(onDoneNote).toHaveBeenCalledWith(note);
  });

  test('user can save edits to a new note', async () => {
    const [note] = notes;
    const updatedText = ' with changes';
    const onDoneNote = jest.fn();
    renderActivitySection({ ...defaultProps, onDoneNote });

    expect(onDoneNote).toHaveBeenCalledTimes(0);

    const editNoteIcon = await screen.findByTestId(`activitySection-editIcon-${note.id}`);
    await userEvent.click(editNoteIcon);

    const noteTextArea = await screen.findByTestId(`activitySection-noteTextArea-${note.id}`);
    await userEvent.type(noteTextArea, updatedText);

    const doneNoteButton = await screen.findByTestId(`activitySection-noteDone-${note.id}`);
    await userEvent.click(doneNoteButton);

    expect(onDoneNote).toHaveBeenCalledTimes(1);
    expect(onDoneNote).toHaveBeenCalledWith(expect.objectContaining(note));
    expect((await screen.queryByText(doneNoteButton))).toBeNull();
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
    await userEvent.click(timeSortButton);

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('wildlife_sighting_rep'))).toBeDefined();
    expect((await within(items[1]).findAllByText(/black view test\s+is immobile/))).toBeDefined();
    expect((await within(items[2]).findAllByText('file1.pdf'))).toBeDefined();
    expect((await within(items[3]).findAllByText('file2.pdf'))).toBeDefined();
    expect((await within(items[4]).findAllByText('file1.png'))).toBeDefined();
  });

  test('expands all expandable items when clicking the button Expand All', async () => {
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');
    await userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });
  });

  test('collapses all expandable items when clicking the button Collapse All', async () => {
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');
    await userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });

    await userEvent.click(expandCollapseButton);

    await waitFor(() => {
      collapses.filter((collapse) => !isUnsavedNoteCollapse(collapse))
        .forEach((collapse) => expect(collapse).not.toHaveClass('show'));
    });

    collapses.filter(isUnsavedNoteCollapse).forEach((collapse) => expect(collapse).toHaveClass('show'));
  });

  test('swaps the expand all button for the collapse all one once every item is expanded', async () => {
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');

    expect(expandCollapseButton).toHaveTextContent('Expand All');

    await userEvent.click(expandCollapseButton);

    await waitFor(() => {
      expect(expandCollapseButton).toHaveTextContent('Collapse All');
    });

    await userEvent.click(expandCollapseButton);

    await waitFor(() => {
      expect(expandCollapseButton).toHaveTextContent('Expand All');
    });
  });

  test('expanding an item leaves the rest of the items collapsed', async () => {
    const [note] = notes;
    renderActivitySection();

    await userEvent.click(await screen.findByTestId(`activitySection-arrowDown-${note.id}`));

    const expandedCollapse = await screen.findByTestId(`activitySection-collapse-${note.id}`);

    await waitFor(() => {
      expect(expandedCollapse).toHaveClass('show');
    });

    const otherCollapses = (await screen.findAllByTestId((content) => content.startsWith('activitySection-collapse')))
      .filter((collapse) => collapse !== expandedCollapse && !isUnsavedNoteCollapse(collapse));

    expect(otherCollapses.length).toBeGreaterThan(0);
    otherCollapses.forEach((collapse) => expect(collapse).not.toHaveClass('show'));
  });

  test('keeps offering Expand All after removing the only expanded item', async () => {
    const [noteToAdd] = notesToAdd;
    const [existingNote] = notes;

    const StatefulActivitySection = () => {
      const [notesPendingToAdd, setNotesPendingToAdd] = useState([noteToAdd]);

      return <ActivitySection
        {...defaultProps}
        attachments={[]}
        attachmentsToAdd={[]}
        containedReports={[]}
        notes={[existingNote]}
        notesToAdd={notesPendingToAdd}
        onDeleteNote={({ tmpId }) => setNotesPendingToAdd((current) => current.filter((note) => note.tmpId !== tmpId))}
      />;
    };

    render(
      <Provider store={mockStore(store)}>
        <TrackerContext.Provider value={tracker}>
          <StatefulActivitySection />
        </TrackerContext.Provider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`activitySection-collapse-${noteToAdd.text}`)).toHaveClass('show');
    });

    await userEvent.click(await screen.findByTestId(`activitySection-deleteIcon-${noteToAdd.text}`));

    await waitFor(() => {
      expect(screen.queryByTestId(`activitySection-collapse-${noteToAdd.text}`)).toBeNull();
    });

    expect(screen.getByTestId(`activitySection-collapse-${existingNote.id}`)).not.toHaveClass('show');
    expect(screen.getByTestId('detailView-activitySection-expandCollapseButton')).toHaveTextContent('Expand All');
  });

  test('expands a note that was never saved automatically', async () => {
    renderActivitySection({
      ...defaultProps,
      attachments: [],
      attachmentsToAdd: [],
      containedReports: [],
      notes: [],
      notesToAdd: [{ creationDate: currentDate.toISOString(), text: '', tmpId: 'emptyNote-tmpId' }],
    });

    expect(await screen.findByRole('button', { name: 'Collapse note' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('shows the start and end date items', async () => {
    renderActivitySection();

    expect(await screen.findByText('Started')).toBeDefined();
    expect(await screen.findByText('Ended')).toBeDefined();
  });

  test('tracks expanding and collapsing an individual card', async () => {
    const [note] = notes;
    renderActivitySection();

    await userEvent.click(await screen.findByTestId(`activitySection-arrowDown-${note.id}`));

    expect(tracker.track).toHaveBeenCalledWith('Expand existing note card in the activity section');

    await userEvent.click(await screen.findByTestId(`activitySection-arrowUp-${note.id}`));

    expect(tracker.track).toHaveBeenCalledWith('Collapse existing note card in the activity section');
  });

  test('tracks expanding and collapsing every card at once', async () => {
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');
    await userEvent.click(expandCollapseButton);

    expect(tracker.track).toHaveBeenCalledWith('Expand All');

    await userEvent.click(expandCollapseButton);

    expect(tracker.track).toHaveBeenCalledWith('Collapse All');
  });

  test('does not track toggling all the cards when none of them is collapsible', async () => {
    renderActivitySection({
      ...defaultProps,
      attachments: [],
      attachmentsToAdd: [],
      containedReports: [],
      notes: [],
      notesToAdd: [],
    });

    await userEvent.click(await screen.findByTestId('detailView-activitySection-expandCollapseButton'));

    expect(tracker.track).not.toHaveBeenCalledWith('Expand All');
  });

  test('expands all the items when contained reports are hidden because events are not enabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderActivitySection();

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');
    await userEvent.click(expandCollapseButton);

    await waitFor(() => {
      expect(expandCollapseButton).toHaveTextContent('Collapse All');
    });
  });

  test('shows activity action buttons if there are items', async () => {
    renderActivitySection();

    expect((await screen.findByText('Expand All'))).toBeDefined();
    expect((await screen.findByTestId('time-sort-btn'))).toBeDefined();
  });

  test('shows the Expand All label when there are items but none are collapsible', async () => {
    renderActivitySection({
      ...defaultProps,
      attachments: [],
      attachmentsToAdd: [],
      containedReports: [],
      notes: [],
      notesToAdd: [],
    });

    const expandCollapseButton = await screen.findByTestId('detailView-activitySection-expandCollapseButton');

    expect(expandCollapseButton).toHaveTextContent('Expand All');

    await userEvent.click(expandCollapseButton);

    expect(expandCollapseButton).toHaveTextContent('Expand All');
  });

  test('hides activity action buttons if items list is empty', async () => {
    renderActivitySection({
      ...defaultProps,
      attachments: [],
      attachmentsToAdd: [],
      containedReports: [],
      endTime: null,
      notes: [],
      notesToAdd: [],
      startTime: null,
    });

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('time-sort-btn'))).toBeNull();
  });
});
