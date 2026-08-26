import React from 'react';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'react-router';
import userEvent from '@testing-library/user-event';

import AddItemButton from '../../../AddItemButton';
import { addPatrolSegmentToEvent } from '../../../utils/events';
import { fetchPatrol, updatePatrol, uploadPatrolFile } from '../../../ducks/patrols';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import patrols from '../../../__test-helpers/fixtures/patrols';
import { act, render, screen, waitFor } from '../../../test-utils';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../../constants';
import * as trackUtils from '../../../utils/tracks';
import { TRACK_LENGTH_ORIGINS } from '../../../ducks/tracks';
import useNavigate from '../../../hooks/useNavigate';

import PatrolOverview from './';

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

// Navigates the same way the footer add event button does: through a pending
// navigation held by the navigation context until the blocker lets it through.
const NavigateAwayButton = () => {
  const navigate = useNavigate();

  return <button onClick={() => navigate('/events/new')} type="button">Navigate away</button>;
};

jest.mock('../../../AddItemButton', () => jest.fn());

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
  updatePatrol: jest.fn(),
  uploadPatrolFile: jest.fn(),
}));

jest.mock('../../../utils/events', () => ({
  ...jest.requireActual('../../../utils/events'),
  addPatrolSegmentToEvent: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolOverview', () => {
  const patrolWithoutLeader = patrols[0];
  const patrolWithLeader = patrols[1];
  const patrolWithNotes = {
    ...patrols[0],
    notes: [
      { id: 'note1', text: 'First note', updates: [{ time: '2021-10-06T00:39:35.986902+00:00' }] },
      { id: 'note2', text: 'Second note', updates: [{ time: '2021-10-06T00:39:35.986902+00:00' }] },
    ],
  };

  let addItemButtonMock;
  let store;
  beforeEach(() => {
    jest.clearAllMocks();

    addItemButtonMock = jest.fn(() => <button data-testid="addEventButton" type="button" />);
    AddItemButton.mockImplementation(addItemButtonMock);

    fetchPatrol.mockImplementation(() => () => Promise.resolve());
    updatePatrol.mockImplementation(() => () => Promise.resolve());
    uploadPatrolFile.mockResolvedValue({});
    jest.spyOn(toast, 'error').mockImplementation(() => {});
    jest.spyOn(trackUtils, 'fetchTracksIfNecessary').mockImplementation(() => Promise.resolve({}));

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolStore: {},
        patrolTypes,
        subjectStore: {},
        tracks: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } },
      },
      view: {
        patrolTrackState: {
          pinned: [],
          visible: [],
        },
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        },
        timeSliderState: {
          active: false,
        },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderPatrolOverview = (patrolId, { withLocationDisplay = false, withNavigateAwayButton = false } = {}) => {
    useParams.mockReturnValue({ patrolId });

    return render(
      <Provider store={mockStore(store)}>
        <PatrolOverview />

        {withLocationDisplay && <LocationDisplay />}

        {withNavigateAwayButton && <NavigateAwayButton />}
      </Provider>,
      { initialEntries: [`/patrols/${patrolId}`] }
    );
  };

  test('fetches the patrol if it is not in the store', () => {
    renderPatrolOverview(patrolWithoutLeader.id);

    expect(fetchPatrol).toHaveBeenCalledWith(patrolWithoutLeader.id);
  });

  test('sends the user back to the feed when the patrol it is asked for is gone', async () => {
    fetchPatrol.mockImplementation(() => () => Promise.reject(
      Object.assign(new Error('Not found'), { response: { status: 404 } })
    ));

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

    await waitFor(() => {
      expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
    });
  });

  test('sends the user back to the feed when the patrol fetch fails for any other reason', async () => {
    fetchPatrol.mockImplementation(() => () => Promise.reject(new Error('Network error')));

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

    await waitFor(() => {
      expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
    });
  });

  test('fetches the patrol even when the store already lists it, since the feed leaves out its detail', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(fetchPatrol).toHaveBeenCalledWith(patrolWithoutLeader.id);
  });

  test('fetches the patrol leg tracks if necessary', () => {
    store.data.patrolStore[patrolWithLeader.id] = patrolWithLeader;

    renderPatrolOverview(patrolWithLeader.id);

    const segment = patrolWithLeader.patrol_segments[0];

    expect(trackUtils.fetchTracksIfNecessary).toHaveBeenCalledWith(
      [segment.leader.id],
      {
        optionalDateBoundaries: {
          since: segment.time_range.start_time,
          until: segment.time_range.end_time,
        },
      },
    );
  });

  test('shows a loader if the patrol is not in the store', () => {
    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByTestId('patrolOverview-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('patrolOverview-title')).not.toBeInTheDocument();
  });

  test('shows the header', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByTestId('patrolOverview-title')).toHaveValue(patrolWithoutLeader.title);
  });

  test('shows the tabs', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByTestId('patrolOverview-overviewTab')).toBeInTheDocument();
    expect(screen.getByTestId('patrolOverview-historyTab')).toBeInTheDocument();
  });

  test('switches to the history tab when it is selected', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const historyTab = screen.getByRole('tab', { name: 'History' });

    expect(historyTab).toHaveAttribute('aria-selected', 'false');

    await userEvent.click(historyTab);

    expect(historyTab).toHaveAttribute('aria-selected', 'true');
  });

  test('shows the footer', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('adds a new note when clicking the footer note button', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(screen.queryByTestId('note-icon')).not.toBeInTheDocument();

    await userEvent.click(await screen.findByTestId('addNoteButton'));

    expect(await screen.findAllByTestId('note-icon')).toHaveLength(1);
  });

  test('disables the note button while there is an unsaved note', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const addNoteButton = await screen.findByTestId('addNoteButton');

    expect(addNoteButton).toBeEnabled();

    await userEvent.click(addNoteButton);

    expect(addNoteButton).toBeDisabled();
    expect(await screen.findAllByTestId('note-icon')).toHaveLength(1);
  });

  test('re-enables the note button once the unsaved note is saved', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const addNoteButton = await screen.findByTestId('addNoteButton');
    await userEvent.click(addNoteButton);

    await userEvent.type(await screen.findByTestId('activitySection-noteTextArea-'), 'a note');
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(addNoteButton).toBeEnabled();
  });

  test('deletes a pending note', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    await userEvent.click(await screen.findByTestId('addNoteButton'));
    await userEvent.click(await screen.findByTestId('activitySection-deleteIcon-'));

    expect(screen.queryByTestId('note-icon')).not.toBeInTheDocument();
  });

  test('reverts a note to its saved text when editing is cancelled, leaving other notes untouched', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    await userEvent.click(await screen.findByTestId('addNoteButton'));
    await userEvent.type(screen.getByTestId('activitySection-noteTextArea-'), 'first note');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-first note'));

    await userEvent.click(screen.getByTestId('addNoteButton'));
    await userEvent.type(screen.getByTestId('activitySection-noteTextArea-'), 'second note');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-second note'));

    await userEvent.click(screen.getByTestId('activitySection-editIcon-first note'));

    const textarea = screen.getByTestId('activitySection-noteTextArea-first note');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'first note edited');

    await userEvent.click(screen.getByTestId('activitySection-noteCancel-first note edited'));

    expect(textarea).toHaveValue('first note');
    expect(screen.getByTestId('activitySection-noteTitle-second note')).toBeInTheDocument();
  });

  test('keeps other pending notes intact when marking one note as done', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    await userEvent.click(await screen.findByTestId('addNoteButton'));
    await userEvent.type(screen.getByTestId('activitySection-noteTextArea-'), 'first note');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-first note'));

    await userEvent.click(screen.getByTestId('addNoteButton'));
    await userEvent.type(screen.getByTestId('activitySection-noteTextArea-'), 'second note');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-second note'));

    expect(screen.getByTestId('activitySection-noteTitle-first note')).toBeInTheDocument();
    expect(screen.getByTestId('activitySection-noteTitle-second note')).toBeInTheDocument();
  });

  const rerenderWithStore = (rerender) => rerender(
    <Provider store={mockStore(store)}>
      <PatrolOverview />
    </Provider>
  );

  const renderPatrolWithNotes = () => {
    store.data.patrolStore[patrolWithNotes.id] = patrolWithNotes;

    return renderPatrolOverview(patrolWithNotes.id, { withLocationDisplay: true });
  };

  const editFirstNote = async (text) => {
    await userEvent.click(await screen.findByTestId('activitySection-editIcon-note1'));

    const textarea = screen.getByTestId('activitySection-noteTextArea-note1');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, text);

    return textarea;
  };

  test('shows the notes the patrol was saved with', async () => {
    renderPatrolWithNotes();

    expect((await screen.findByTestId('activitySection-noteTextArea-note1'))).toHaveValue('First note');
    expect(screen.getByTestId('activitySection-noteTextArea-note2')).toHaveValue('Second note');
  });

  test('user can edit an existing note', async () => {
    renderPatrolWithNotes();

    const textarea = await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    expect(textarea).toHaveValue('First note edited');
    expect(screen.getByTestId('activitySection-noteTitle-note1')).toHaveTextContent('First note edited');
    expect(screen.getByTestId('activitySection-noteTextArea-note2')).toHaveValue('Second note');
  });

  test('marks an existing note as unsaved while its text differs from the one it was saved with', async () => {
    renderPatrolWithNotes();

    await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    expect(screen.getByTestId('activitySection-noteTitle-note1')).toHaveClass('unsaved');
    expect(screen.getByTestId('activitySection-noteTitle-note2')).not.toHaveClass('unsaved');
  });

  test('stops marking an existing note as unsaved once it is typed back to its saved text', async () => {
    renderPatrolWithNotes();

    await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    await editFirstNote('  First note  ');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    expect(screen.getByTestId('activitySection-noteTitle-note1')).not.toHaveClass('unsaved');
  });

  test('trims the text of an existing note when it is saved', async () => {
    renderPatrolWithNotes();

    const textarea = await editFirstNote('  First note edited  ');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    expect(textarea).toHaveValue('First note edited');
  });

  test('reverts an existing note to its saved text when the edition is cancelled', async () => {
    renderPatrolWithNotes();

    const textarea = await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteCancel-note1'));

    expect(textarea).toHaveValue('First note');
  });

  test('reverts an existing note to its saved text when it is collapsed mid edition', async () => {
    renderPatrolWithNotes();

    const textarea = await editFirstNote('First note edited');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse note' }));

    expect(textarea).toHaveValue('First note');
  });

  test('leaves an existing note untouched when its edition is cancelled without any change', async () => {
    renderPatrolWithNotes();

    await userEvent.click(await screen.findByTestId('activitySection-editIcon-note1'));
    await userEvent.click(screen.getByTestId('activitySection-noteCancel-note1'));

    expect(screen.getByTestId('activitySection-noteTextArea-note1')).toHaveValue('First note');

    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  test('keeps an edited existing note when a later edition is cancelled', async () => {
    renderPatrolWithNotes();

    const textarea = await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    await editFirstNote('Something else entirely');
    await userEvent.click(screen.getByTestId('activitySection-noteCancel-note1'));

    expect(textarea).toHaveValue('First note edited');
  });

  test('does not allow saving an existing note that has not changed since the last edition', async () => {
    renderPatrolWithNotes();

    await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    await userEvent.click(screen.getByTestId('activitySection-editIcon-note1'));

    expect(screen.getByTestId('activitySection-noteDone-note1')).toBeDisabled();
  });

  test('does not allow emptying an existing note', async () => {
    renderPatrolWithNotes();

    await userEvent.click(await screen.findByTestId('activitySection-editIcon-note1'));
    await userEvent.clear(screen.getByTestId('activitySection-noteTextArea-note1'));

    expect(screen.getByTestId('activitySection-noteDone-note1')).toBeDisabled();
  });

  test('warns about unsaved changes when an existing note was edited', async () => {
    renderPatrolWithNotes();

    await editFirstNote('First note edited');
    await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));

    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    expect((await screen.findByText('Unsaved Changes'))).toBeInTheDocument();
  });

  test('stops warning about unsaved changes once an existing note is typed back to its saved text', async () => {
    renderPatrolWithNotes();

    await editFirstNote('First note edited');
    await editFirstNote('First note');

    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
  });

  test('adds a new attachment when uploading a file through the footer attachment button', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const fakeFile = new File(['file contents'], 'file.pdf', { type: 'application/pdf' });
    await userEvent.upload(await screen.findByTestId('addAttachmentButton'), fakeFile);

    expect(await screen.findByText('file.pdf')).toBeInTheDocument();
  });

  test('does not add a duplicate attachment with the same filename', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const fakeFile = new File(['file contents'], 'file.pdf', { type: 'application/pdf' });
    const attachmentButton = await screen.findByTestId('addAttachmentButton');

    await userEvent.upload(attachmentButton, fakeFile);
    await userEvent.upload(attachmentButton, fakeFile);

    expect(await screen.findAllByText('file.pdf')).toHaveLength(1);
  });

  test('deletes a pending attachment', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const fakeFile = new File(['file contents'], 'file.pdf', { type: 'application/pdf' });
    await userEvent.upload(await screen.findByTestId('addAttachmentButton'), fakeFile);

    expect(await screen.findByText('file.pdf')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('activitySection-trashCan-file.pdf'));

    expect(screen.queryByText('file.pdf')).not.toBeInTheDocument();
  });

  test('wires the add event button to redirect back to this patrol on save', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const [props] = addItemButtonMock.mock.calls.at(-1);

    expect(props.hideAddPatrolTab).toBe(true);
    expect(props.formProps.isPatrolReport).toBe(true);
    expect(props.formProps.redirectTo).toEqual([{ pathname: `/patrols/${patrolWithoutLeader.id}` }]);
  });

  test('links a newly added event to the most recently active leg and refreshes the patrol', async () => {
    const patrolWithMultipleLegs = {
      ...patrolWithoutLeader,
      patrol_segments: [
        patrolWithoutLeader.patrol_segments[0],
        { ...patrolWithoutLeader.patrol_segments[0], id: 'second-leg-id' },
      ],
    };
    store.data.patrolStore[patrolWithMultipleLegs.id] = patrolWithMultipleLegs;

    renderPatrolOverview(patrolWithMultipleLegs.id);

    const [props] = addItemButtonMock.mock.calls.at(-1);

    await props.formProps.onSaveSuccess([{ data: { data: { id: 'new-event-id' } } }]);

    expect(addPatrolSegmentToEvent).toHaveBeenCalledWith('second-leg-id', 'new-event-id');
    expect(fetchPatrol).toHaveBeenCalledWith(patrolWithMultipleLegs.id);
  });

  test('also accepts a single, non-array save result when linking a new event', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    const [props] = addItemButtonMock.mock.calls.at(-1);

    await props.formProps.onSaveSuccess({ data: { data: { id: 'new-event-id' } } });

    const [segment] = patrolWithoutLeader.patrol_segments;

    expect(addPatrolSegmentToEvent).toHaveBeenCalledWith(segment.id, 'new-event-id');
  });

  test('shows the unsaved changes prompt and stays on the page if navigation is cancelled', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

    await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    expect(await screen.findByText('Unsaved Changes')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Go Back'));

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrolWithoutLeader.id}`);
  });

  test('does not prompt when navigating away without any unsaved changes', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
  });

  test('offers to go back, discard or save when navigating away with unsaved changes', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    expect(await screen.findByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText(
      'There are unsaved changes. Would you like to go back, discard the changes, or save and continue?'
    )).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Discard')).toBeInTheDocument();
    expect(screen.getByTestId('navigation-prompt-positive-continue-btn')).toBeInTheDocument();
  });

  test('discards unsaved changes and navigates away when confirmed', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

    await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    await userEvent.click(await screen.findByText('Discard'));

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('test-location')).not.toHaveTextContent(patrolWithoutLeader.id);
    });
    expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
    expect(updatePatrol).not.toHaveBeenCalled();
  });

  test('saves the unsaved changes and navigates away when confirmed', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

    await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
    await userEvent.click(screen.getByRole('link', { name: 'Patrols' }));

    await userEvent.click(await screen.findByTestId('navigation-prompt-positive-continue-btn'));

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('test-location')).not.toHaveTextContent(patrolWithoutLeader.id);
    });
    expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
    expect(updatePatrol).toHaveBeenCalledWith({
      id: patrolWithoutLeader.id,
      title: `${patrolWithoutLeader.title} edited`,
    });
  });

  test('resumes a navigation waiting on the prompt after saving the unsaved changes', async () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true, withNavigateAwayButton: true });

    await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
    await userEvent.click(screen.getByRole('button', { name: 'Navigate away' }));

    await userEvent.click(await screen.findByTestId('navigation-prompt-positive-continue-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('test-location')).toHaveTextContent('/events/new');
    });
    expect(updatePatrol).toHaveBeenCalledWith({
      id: patrolWithoutLeader.id,
      title: `${patrolWithoutLeader.title} edited`,
    });
  });

  test('navigates away and reports the error when the save on the way out fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    updatePatrol.mockImplementation(() => () => Promise.reject(new Error('Save error')));
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true, withNavigateAwayButton: true });

    await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
    await userEvent.click(screen.getByRole('button', { name: 'Navigate away' }));

    await userEvent.click(await screen.findByTestId('navigation-prompt-positive-continue-btn'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('The patrol could not be saved. Please try again.');
    });
    await waitFor(() => {
      expect(screen.getByTestId('test-location')).toHaveTextContent('/events/new');
    });
  });

  describe('saving', () => {
    const clickSave = async () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

    const addNote = async (text) => {
      await userEvent.click(await screen.findByTestId('addNoteButton'));
      await userEvent.type(screen.getByTestId('activitySection-noteTextArea-'), text);
      await userEvent.click(screen.getByTestId(`activitySection-noteDone-${text}`));
    };

    const uploadAttachment = async (file) => {
      await userEvent.upload(await screen.findByTestId('addAttachmentButton'), file);
    };

    test('disables the save button while there is nothing to save', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id);

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('enables the save button once there are changes', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id);

      await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');

      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    test('keeps the save button disabled when an existing note only gained whitespace', async () => {
      renderPatrolWithNotes();

      await userEvent.click(await screen.findByTestId('activitySection-editIcon-note1'));
      await userEvent.type(screen.getByTestId('activitySection-noteTextArea-note1'), '  ');

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('keeps the save button disabled when an existing note is emptied', async () => {
      renderPatrolWithNotes();

      await userEvent.click(await screen.findByTestId('activitySection-editIcon-note1'));
      await userEvent.clear(screen.getByTestId('activitySection-noteTextArea-note1'));

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('keeps the save button disabled while a new note has no text yet', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id);

      await userEvent.click(await screen.findByTestId('addNoteButton'));

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('patches the patrol with the edited title only', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id);

      await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
      await clickSave();

      await waitFor(() => {
        expect(updatePatrol).toHaveBeenCalledWith({
          id: patrolWithoutLeader.id,
          title: `${patrolWithoutLeader.title} edited`,
        });
      });
    });

    test('patches the patrol with the whole notes collection when a note is added', async () => {
      renderPatrolWithNotes();

      await addNote('a new note');
      await clickSave();

      await waitFor(() => {
        expect(updatePatrol).toHaveBeenCalledWith({
          id: patrolWithNotes.id,
          notes: [...patrolWithNotes.notes, { text: 'a new note' }],
        });
      });
    });

    test('patches the patrol with the whole notes collection when an existing note is edited', async () => {
      renderPatrolWithNotes();

      await editFirstNote('First note edited');
      await userEvent.click(screen.getByTestId('activitySection-noteDone-note1'));
      await clickSave();

      const [firstNote, secondNote] = patrolWithNotes.notes;
      await waitFor(() => {
        expect(updatePatrol).toHaveBeenCalledWith({
          id: patrolWithNotes.id,
          notes: [{ ...firstNote, text: 'First note edited' }, secondNote],
        });
      });
    });

    test('uploads the new attachments without patching the patrol', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id);

      const fakeFile = new File(['file contents'], 'file.pdf', { type: 'application/pdf' });
      await uploadAttachment(fakeFile);
      await clickSave();

      await waitFor(() => {
        expect(uploadPatrolFile).toHaveBeenCalledWith(patrolWithoutLeader.id, fakeFile);
      });
      expect(updatePatrol).not.toHaveBeenCalled();
    });

    test('refreshes the patrol and redirects to the feed once the save succeeds', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

      await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
      await uploadAttachment(new File(['file contents'], 'file.pdf', { type: 'application/pdf' }));
      await clickSave();

      await waitFor(() => {
        expect(fetchPatrol).toHaveBeenCalledWith(patrolWithoutLeader.id);
      });
      await waitFor(() => {
        expect(screen.getByTestId('test-location')).not.toHaveTextContent(patrolWithoutLeader.id);
      });
      expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    test('keeps the pending changes and reports the error when the save fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      updatePatrol.mockImplementation(() => () => Promise.reject(new Error('Save error')));
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id, { withLocationDisplay: true });

      await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
      await clickSave();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('The patrol could not be saved. Please try again.');
      });
      expect(fetchPatrol).toHaveBeenCalledWith(patrolWithoutLeader.id);
      expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrolWithoutLeader.id}`);
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect(screen.getByTestId('patrolOverview-title')).toHaveValue(`${patrolWithoutLeader.title} edited`);
    });

    test('redirects to the feed before the patrol refresh resolves', async () => {
      fetchPatrol.mockImplementation(() => () => new Promise(() => {}));

      renderPatrolWithNotes();

      await addNote('a new note');
      await clickSave();

      await waitFor(() => {
        expect(screen.getByTestId('test-location')).not.toHaveTextContent(patrolWithNotes.id);
      });
      expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
    });

    test('does not report an error when only the refresh on the way out fails', async () => {
      fetchPatrol.mockImplementation(() => () => Promise.reject(new Error('Refresh error')));

      renderPatrolWithNotes();

      await addNote('a new note');
      await clickSave();

      await waitFor(() => {
        expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols');
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    test('does not patch the notes again when retrying a save whose attachment upload failed', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      uploadPatrolFile.mockRejectedValue(new Error('Upload error'));

      renderPatrolWithNotes();

      await addNote('a new note');
      await uploadAttachment(new File(['file contents'], 'file.pdf', { type: 'application/pdf' }));
      await clickSave();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      expect(updatePatrol).toHaveBeenCalledTimes(1);

      await clickSave();

      await waitFor(() => {
        expect(uploadPatrolFile).toHaveBeenCalledTimes(2);
      });
      expect(updatePatrol).toHaveBeenCalledTimes(1);
    });

    test('does not patch the notes again when the refresh after a partial failure also fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      uploadPatrolFile.mockRejectedValue(new Error('Upload error'));
      fetchPatrol.mockImplementation(() => () => Promise.reject(new Error('Refresh error')));

      renderPatrolWithNotes();

      await addNote('a new note');
      await uploadAttachment(new File(['file contents'], 'file.pdf', { type: 'application/pdf' }));
      await clickSave();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      await clickSave();

      await waitFor(() => {
        expect(uploadPatrolFile).toHaveBeenCalledTimes(2);
      });
      expect(updatePatrol).toHaveBeenCalledTimes(1);
    });

    test('only retries the attachments whose upload failed', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const uploadedFile = new File(['file contents'], 'uploaded.pdf', { type: 'application/pdf' });
      const rejectedFile = new File(['file contents'], 'rejected.pdf', { type: 'application/pdf' });
      uploadPatrolFile.mockImplementation((_, file) => file === rejectedFile
        ? Promise.reject(new Error('Upload error'))
        : Promise.resolve({}));
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      renderPatrolOverview(patrolWithoutLeader.id);

      await uploadAttachment([uploadedFile, rejectedFile]);
      await clickSave();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      uploadPatrolFile.mockClear();

      await clickSave();

      await waitFor(() => {
        expect(uploadPatrolFile).toHaveBeenCalledTimes(1);
      });
      expect(uploadPatrolFile).toHaveBeenCalledWith(patrolWithoutLeader.id, rejectedFile);
    });
  });

  describe('title', () => {
    test('follows the patrol title while the user has not edited it', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      const { rerender } = renderPatrolOverview(patrolWithoutLeader.id);

      expect(screen.getByTestId('patrolOverview-title')).toHaveValue(patrolWithoutLeader.title);

      store.data.patrolStore[patrolWithoutLeader.id] = { ...patrolWithoutLeader, title: 'Renamed patrol' };
      rerenderWithStore(rerender);

      expect(screen.getByTestId('patrolOverview-title')).toHaveValue('Renamed patrol');
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('keeps the edited title when the patrol changes underneath', async () => {
      store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

      const { rerender } = renderPatrolOverview(patrolWithoutLeader.id);

      await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');

      store.data.patrolStore[patrolWithoutLeader.id] = { ...patrolWithoutLeader, title: 'Renamed patrol' };
      rerenderWithStore(rerender);

      expect(screen.getByTestId('patrolOverview-title')).toHaveValue(`${patrolWithoutLeader.title} edited`);
      expect(screen.getByTestId('patrolOverview-title')).toHaveClass('unsaved');
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });
  });

  describe('patrol status', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    const openStatusSelect = () => userEvent.click(
      screen.getByRole('button', { name: /Change patrol status/ })
    );

    const selectStatus = async (name) => {
      await openStatusSelect();
      await userEvent.click(await screen.findByRole('menuitemradio', { name }));
    };

    const savedPayload = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(updatePatrol).toHaveBeenCalledTimes(1);
      });

      return updatePatrol.mock.calls[0][0];
    };

    const renderPatrolInStore = (patrol) => {
      store.data.patrolStore[patrolWithLeader.id] = { ...patrol, id: patrolWithLeader.id };

      return renderPatrolOverview(patrolWithLeader.id);
    };

    const withLastLeg = (patrol, segment) => ({
      ...patrol,
      patrol_segments: [{ ...patrol.patrol_segments.at(-1), ...segment }],
    });

    test('follows the patrol state while the user has not picked one', async () => {
      const { rerender } = renderPatrolInStore(patrolWithLeader);

      expect(screen.getByRole('button', { name: 'Active, Change patrol status' })).toBeInTheDocument();

      store.data.patrolStore[patrolWithLeader.id] = { ...patrolWithLeader, state: 'done' };
      rerenderWithStore(rerender);

      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('follows the patrol state as it transitions on its own', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-13T12:00:00.000Z'));

      renderPatrolInStore(withLastLeg(patrolWithLeader, {
        time_range: { start_time: '2026-04-13T12:10:00.000Z', end_time: null },
      }));

      expect(screen.getByRole('button', { name: 'Ready to Start, Change patrol status' })).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10 * 60_000 + 1);
      });

      expect(screen.getByRole('button', { name: 'Active, Change patrol status' })).toBeInTheDocument();
    });

    test('keeps the picked state when the patrol changes underneath', async () => {
      const { rerender } = renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');

      store.data.patrolStore[patrolWithLeader.id] = { ...patrolWithLeader, title: 'Renamed patrol' };
      rerenderWithStore(rerender);

      expect(screen.getByRole('button', { name: 'Done, Change patrol status' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    test('does not update the patrol until it is saved', async () => {
      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');

      expect(updatePatrol).not.toHaveBeenCalled();
    });

    test('enables saving once a status is picked', async () => {
      renderPatrolInStore(patrolWithLeader);

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      await selectStatus('Done');

      expect(screen.getByText('Done')).toHaveClass('unsavedLabel');
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    test('drops the change when the status the patrol is already in is picked back', async () => {
      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');
      await selectStatus('Active');

      expect(screen.getByRole('button', { name: 'Active, Change patrol status' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('does not turn picking the status the patrol is already in into a change when it later moves on', async () => {
      const { rerender } = renderPatrolInStore(patrolWithLeader);

      await selectStatus('Active');

      store.data.patrolStore[patrolWithLeader.id] = { ...patrolWithLeader, state: 'done' };
      rerenderWithStore(rerender);

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('still sends the picked status when the patrol reaches it on its own before saving', async () => {
      const { rerender } = renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');

      store.data.patrolStore[patrolWithLeader.id] = { ...patrolWithLeader, state: 'done' };
      rerenderWithStore(rerender);

      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect((await savedPayload()).state).toBe('done');
    });

    test('sends the status picked last when another one replaces it', async () => {
      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');
      await selectStatus('Cancelled');

      expect((await savedPayload()).state).toBe('cancelled');
    });

    test('sends the update built for the picked status when the patrol is saved', async () => {
      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');

      const payload = await savedPayload();

      expect(payload.id).toBe(patrolWithLeader.id);
      expect(payload.state).toBe('done');
      expect(payload.patrol_segments.at(-1).time_range.end_time).toBeTruthy();
    });

    test('sends the state alone when the patrol is cancelled', async () => {
      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Cancelled');

      expect(await savedPayload()).toEqual({ id: patrolWithLeader.id, state: 'cancelled' });
    });

    test('sends the picked status together with the edited title', async () => {
      renderPatrolInStore(patrolWithLeader);

      await userEvent.type(screen.getByTestId('patrolOverview-title'), ' edited');
      await selectStatus('Cancelled');

      const payload = await savedPayload();

      expect(payload.state).toBe('cancelled');
      expect(payload.title).toMatch(/ edited$/);
    });

    test('stamps the status change with the moment the patrol is saved, not the moment it is picked', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-13T12:00:00.000Z'));
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderPatrolInStore(patrolWithLeader);

      await user.click(screen.getByRole('button', { name: /Change patrol status/ }));
      await user.click(await screen.findByRole('menuitemradio', { name: 'Done' }));

      act(() => {
        jest.advanceTimersByTime(5 * 60_000);
      });

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(updatePatrol).toHaveBeenCalledTimes(1);
      });

      expect(updatePatrol.mock.calls[0][0].patrol_segments.at(-1).time_range.end_time)
        .toBe('2026-04-13T12:05:00.000Z');
    });

    test('builds the status update from the patrol as it stands when it is saved', async () => {
      const { rerender } = renderPatrolInStore(patrolWithLeader);

      await selectStatus('Done');

      store.data.patrolStore[patrolWithLeader.id] = withLastLeg(
        { ...patrolWithLeader, id: patrolWithLeader.id },
        { id: 'leg-changed-while-editing' }
      );
      rerenderWithStore(rerender);

      expect((await savedPayload()).patrol_segments.at(-1).id).toBe('leg-changed-while-editing');
    });

    test('has nothing to send for a pause until the API models paused patrols', async () => {
      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Paused');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(fetchPatrol).toHaveBeenCalledWith(patrolWithLeader.id);
      });
      expect(updatePatrol).not.toHaveBeenCalled();
    });

    test('prompts before navigating away with a picked status', async () => {
      store.data.patrolStore[patrolWithLeader.id] = patrolWithLeader;

      renderPatrolOverview(patrolWithLeader.id, { withNavigateAwayButton: true });

      await selectStatus('Done');
      await userEvent.click(screen.getByRole('button', { name: 'Navigate away' }));

      expect(await screen.findByTestId('navigation-prompt-positive-continue-btn')).toBeInTheDocument();
    });

    test('clears the picked status once the patrol update goes through', async () => {
      uploadPatrolFile.mockRejectedValue(new Error('Upload error'));
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      renderPatrolInStore(patrolWithLeader);

      await selectStatus('Cancelled');

      const fakeFile = new File(['file contents'], 'file.pdf', { type: 'application/pdf' });
      await userEvent.upload(screen.getByTestId('addAttachmentButton'), fakeFile);

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      // The attachment upload failed, so the view stays put. The status change went through, so it
      // stops counting as a change and the pill falls back to the patrol's own state.
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Active, Change patrol status' })).toBeInTheDocument();
      });
      expect(updatePatrol).toHaveBeenCalledWith({ id: patrolWithLeader.id, state: 'cancelled' });
    });
  });
});
