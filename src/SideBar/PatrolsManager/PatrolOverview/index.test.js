import React from 'react';
import { Provider } from 'react-redux';
import { useLocation, useParams } from 'react-router';
import userEvent from '@testing-library/user-event';

import AddItemButton from '../../../AddItemButton';
import { addPatrolSegmentToEvent } from '../../../utils/events';
import { fetchPatrol } from '../../../ducks/patrols';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';
import patrols from '../../../__test-helpers/fixtures/patrols';
import { render, screen, waitFor } from '../../../test-utils';
import { SYSTEM_CONFIG_FLAGS } from '../../../constants';
import * as trackUtils from '../../../utils/tracks';
import { TRACK_LENGTH_ORIGINS } from '../../../ducks/tracks';

import PatrolOverview from './';

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

jest.mock('../../../AddItemButton', () => jest.fn());

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
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

  let addItemButtonMock;
  let store;
  beforeEach(() => {
    jest.clearAllMocks();

    addItemButtonMock = jest.fn(() => <button data-testid="addEventButton" type="button" />);
    AddItemButton.mockImplementation(addItemButtonMock);

    fetchPatrol.mockReturnValue({ type: 'FETCH_PATROL' });
    jest.spyOn(trackUtils, 'fetchTracksIfNecessary').mockImplementation(() => Promise.resolve({}));

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolStore: {},
        patrolTypes,
        subjectStore: {},
        tracks: {},
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

  const renderPatrolOverview = (patrolId, { withLocationDisplay = false } = {}) => {
    useParams.mockReturnValue({ patrolId });

    return render(
      <Provider store={mockStore(store)}>
        <PatrolOverview />

        {withLocationDisplay && <LocationDisplay />}
      </Provider>,
      { initialEntries: [`/patrols/${patrolId}`] }
    );
  };

  test('fetches the patrol if it is not in the store', () => {
    renderPatrolOverview(patrolWithoutLeader.id);

    expect(fetchPatrol).toHaveBeenCalledWith(patrolWithoutLeader.id);
  });

  test('does not fetch the patrol if it is in the store', () => {
    store.data.patrolStore[patrolWithoutLeader.id] = patrolWithoutLeader;

    renderPatrolOverview(patrolWithoutLeader.id);

    expect(fetchPatrol).not.toHaveBeenCalled();
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
  });
});
