import React from 'react';
import { Provider } from 'react-redux';
import { Link, Route, Routes, useLocation } from 'react-router';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { addPatrolSegmentToEvent } from '../../../../utils/events';
import { createMapMock } from '../../../../__test-helpers/mocks';
import { fetchEvent } from '../../../../ducks/events';
import {
  fetchDefaultPatrolSegmentTypeSchema,
  fetchPatrolTypeSchema,
} from '../../../../ducks/patrol-schemas';
import { fetchPatrol, updatePatrol, uploadPatrolFile } from '../../../../ducks/patrols';
import { GPS_FORMATS } from '../../../../utils/location';
import { MapContext } from '../../../../MapContext';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { multiLegPatrol } from '../../../../__test-helpers/fixtures/patrols';
import patrolTypes from '../../../../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../../../constants';
import { render, screen, waitFor } from '../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../ducks/tracks';

import LegOverview from './';

jest.mock('../../../../ducks/events', () => ({
  ...jest.requireActual('../../../../ducks/events'),
  fetchEvent: jest.fn(),
}));

jest.mock('../../../../ducks/patrol-schemas', () => ({
  ...jest.requireActual('../../../../ducks/patrol-schemas'),
  fetchDefaultPatrolSegmentTypeSchema: jest.fn(),
  fetchPatrolTypeSchema: jest.fn(),
}));

jest.mock('../../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
  updatePatrol: jest.fn(),
  uploadPatrolFile: jest.fn(),
}));

jest.mock('../../../../AddItemButton', () => {
  const AddItemButton = ({ formProps, label, ...otherProps }) => <button
    onClick={() => formProps.onSaveSuccess({ data: { data: { id: 'new-event' } } })}
    type="button"
    {...otherProps}
    >
    {label}
  </button>;

  return AddItemButton;
});

jest.mock('../../../../utils/events', () => ({
  ...jest.requireActual('../../../../utils/events'),
  addPatrolSegmentToEvent: jest.fn(),
}));

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

const ADD_EVENT_BUTTON_LABEL = 'Report an event on this patrol leg';

describe('SideBar - PatrolsManager - LegManager - LegOverview', () => {
  const map = createMapMock();
  const patrol = multiLegPatrol;
  const endedPatrolSegment = patrol.patrol_segments[0];
  const activePatrolSegment = patrol.patrol_segments[1];

  let store;
  beforeEach(() => {
    jest.spyOn(toast, 'error').mockImplementation(() => {});

    addPatrolSegmentToEvent.mockImplementation(() => Promise.resolve());
    fetchDefaultPatrolSegmentTypeSchema.mockImplementation(() => () => {});
    fetchEvent.mockImplementation(() => () => Promise.resolve());
    fetchPatrolTypeSchema.mockImplementation(() => () => {});
    fetchPatrol.mockImplementation(() => () => Promise.resolve());
    updatePatrol.mockImplementation(() => () => Promise.resolve());
    uploadPatrolFile.mockImplementation(() => Promise.resolve());

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        eventStore: {},
        eventTypes: [],
        patrolSchemas: {},
        patrolTypes,
        subjectStore: {},
        tracks: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } },
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        patrolTrackState: { pinned: [], visible: [] },
        systemConfig: { [SYSTEM_CONFIG_FLAGS.EVENTS]: true },
        timeSliderState: { active: false },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const renderLegOverview = ({ legId = endedPatrolSegment.id, ...props } = {}) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <Routes>
          <Route element={<LegOverview patrol={patrol} {...props} />} path="/patrols/:patrolId/legs/:legId" />

          <Route element={<LocationDisplay />} path="/patrols/:patrolId" />
        </Routes>
      </MapContext.Provider>
    </Provider>,
    { initialEntries: [`/patrols/${patrol.id}/legs/${legId}`] }
  );

  test('shows the header, the plan, the activity and the footer of the leg', () => {
    renderLegOverview();

    expect(screen.getByRole('heading', { level: 2, name: 'Leg 1' })).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
  });

  test('does not offer to edit a leg the mobile app is still running', () => {
    renderLegOverview({
      legId: activePatrolSegment.id,
      patrol: { ...patrol, provenance: 'mobile' },
    });

    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  test('offers to edit a leg the mobile app has already finished', () => {
    renderLegOverview({ patrol: { ...patrol, provenance: 'mobile' } });

    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
  });

  test('numbers a leg by its place among every segment, pauses included', () => {
    const pause = { ...endedPatrolSegment, id: 'pause-1', is_pause: true };

    renderLegOverview({
      legId: activePatrolSegment.id,
      patrol: { ...patrol, patrol_segments: [endedPatrolSegment, pause, activePatrolSegment] },
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Leg 3' })).toBeInTheDocument();
  });

  test('redirects to the patrol when the leg is not one of its own', async () => {
    renderLegOverview({ legId: 'not-a-leg-of-this-patrol' });

    expect(await screen.findByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}`);
  });

  test('lists only the events of the leg', () => {
    const legEvent = { id: 'leg-1-event', time: '2026-04-13T01:30:00.000-07:00', title: 'Leg 1 event' };
    const otherLegEvent = { id: 'leg-2-event', time: '2026-04-13T02:30:00.000-07:00', title: 'Leg 2 event' };

    store.data.eventStore = { [legEvent.id]: legEvent, [otherLegEvent.id]: otherLegEvent };

    renderLegOverview({
      patrol: {
        ...patrol,
        patrol_segments: [
          { ...endedPatrolSegment, events: [legEvent] },
          { ...patrol.patrol_segments[1], events: [otherLegEvent] },
        ],
      },
    });

    expect(screen.getByTestId(`activitySection-collapse-${legEvent.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`activitySection-collapse-${otherLegEvent.id}`)).not.toBeInTheDocument();
  });

  test('lists only the notes written while the leg ran', () => {
    const legNote = { id: 'note-1', text: 'Written during leg 1', updated_at: '2026-04-13T01:30:00.000-07:00' };
    const laterNote = { id: 'note-2', text: 'Written during leg 2', updated_at: '2026-04-13T02:30:00.000-07:00' };

    renderLegOverview({ patrol: { ...patrol, notes: [legNote, laterNote] } });

    expect(screen.getByTestId(`activitySection-noteTitle-${legNote.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`activitySection-noteTitle-${laterNote.id}`)).not.toBeInTheDocument();
  });

  test('shows the elapsed times of the leg', () => {
    renderLegOverview();

    expect(screen.getByText('Duration').nextElementSibling).toHaveTextContent('1h');
  });

  test('does not let a leg that has ended take notes, attachments or events', () => {
    renderLegOverview();

    expect(screen.getByTestId('addNoteButton')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add an attachment' })).toBeDisabled();
    expect(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL })).toBeDisabled();
  });

  test('lets a leg under way take notes, attachments and events', () => {
    renderLegOverview({ legId: activePatrolSegment.id });

    expect(screen.getByTestId('addNoteButton')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add an attachment' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL })).not.toBeDisabled();
  });

  test('stages a note and saves it onto the patrol', async () => {
    renderLegOverview({ legId: activePatrolSegment.id });

    await userEvent.click(screen.getByTestId('addNoteButton'));
    await userEvent.type(screen.getByRole('textbox'), 'A new note');
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updatePatrol).toHaveBeenCalledWith({
      id: patrol.id,
      notes: [{ text: 'A new note' }],
    }));
  });

  test('does not carry what the user staged on one leg over to the next', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <Link to={`/patrols/${patrol.id}/legs/${endedPatrolSegment.id}`}>Go to the other leg</Link>

          <Routes>
            <Route element={<LegOverview patrol={patrol} />} path="/patrols/:patrolId/legs/:legId" />
          </Routes>
        </MapContext.Provider>
      </Provider>,
      { initialEntries: [`/patrols/${patrol.id}/legs/${activePatrolSegment.id}`] }
    );

    await userEvent.click(screen.getByTestId('addNoteButton'));
    await userEvent.type(screen.getByRole('textbox'), 'A new note');

    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();

    await userEvent.click(screen.getByRole('link', { name: 'Go to the other leg' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Leg 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('links a new event to the leg it was reported on', async () => {
    renderLegOverview({ legId: activePatrolSegment.id });

    await userEvent.click(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL }));

    await waitFor(() => expect(addPatrolSegmentToEvent).toHaveBeenCalledWith(activePatrolSegment.id, 'new-event'));
  });

  test('warns the user and still refreshes the patrol when a new event could not be linked to the leg', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    addPatrolSegmentToEvent.mockImplementation(() => Promise.reject(new Error('link error')));

    renderLegOverview({ legId: activePatrolSegment.id });

    await userEvent.click(screen.getByRole('button', { name: ADD_EVENT_BUTTON_LABEL }));

    await waitFor(() => expect(toast.error)
      .toHaveBeenCalledWith('The event was saved but could not be added to this patrol leg.'));
    expect(fetchPatrol).toHaveBeenCalledWith(patrol.id);
  });
});
