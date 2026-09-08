import React from 'react';
import { Provider } from 'react-redux';
import { Route, Routes, useLocation } from 'react-router';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../../../__test-helpers/mocks';
import { DEFAULT_PATROL_SEGMENT_TYPE } from '../../../../ducks/patrol-schemas';
import {
  defaultPatrolSegmentTypeSchema,
  patrolTypeFieldsSchema,
} from '../../../../__test-helpers/fixtures/patrol-schemas';
import { GPS_FORMATS } from '../../../../utils/location';
import { MapContext } from '../../../../MapContext';
import { mockStore } from '../../../../__test-helpers/MockStore';
import patrolTypes, { dogPatrol, routinePatrol } from '../../../../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS } from '../../../../constants';
import { render, screen, waitFor, within } from '../../../../test-utils';
import { updatePatrol } from '../../../../ducks/patrols';
import { updateUserPreferences } from '../../../../ducks/user-preferences';

import NewLeg from './';

jest.mock('../../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));
jest.mock('../../../../ducks/user-preferences', () => ({
  ...jest.requireActual('../../../../ducks/user-preferences'),
  updateUserPreferences: jest.fn(),
}));

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

describe('SideBar - PatrolsManager - LegManager - NewLeg', () => {
  const teamLead = { id: 'leader-1', name: 'Alex' };

  let map, patrol, reduxStore, store;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date(2026, 3, 13, 12, 0));

    updatePatrol.mockImplementation(() => () => Promise.resolve());
    updateUserPreferences.mockImplementation(() => () => {});

    map = createMapMock();

    patrol = {
      id: '93485e1d-6804-459b-9243-1d239556bb48',
      patrol_segments: [{
        end_location: { latitude: 2, longitude: 3 },
        id: '76794b2f-cbb2-49ed-b0dd-9335ae471562',
        leader: teamLead,
        patrol_type: dogPatrol.value,
        scheduled_end: new Date(2026, 3, 13, 10, 0).toISOString(),
        start_location: { latitude: 0, longitude: 1 },
        time_range: {
          end_time: null,
          start_time: new Date(2026, 3, 13, 6, 0).toISOString(),
        },
      }],
      serial_number: 1298,
      state: 'open',
      title: 'Delta Patrol',
    };

    store = {
      data: {
        patrolSchemas: {
          [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: defaultPatrolSegmentTypeSchema },
          [dogPatrol.value]: { isLoading: false, schema: patrolTypeFieldsSchema },
          [routinePatrol.value]: { isLoading: false, schema: patrolTypeFieldsSchema },
        },
        patrolTeamAndTrackingOptions: { assets: [], leaders: [teamLead], teamMembers: [], teams: [] },
        patrolTypes,
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE] } },
        userContent: {},
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        mapLocationSelection: { isPickingLocation: false },
        modals: { canShowModals: true },
        showUserLocation: false,
        userLocation: null,
        userPreferences: { autoEndPatrols: false, autoStartPatrols: false, gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderNewLeg = () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    reduxStore = mockStore(store);

    const renderResult = render(
      <Provider store={reduxStore}>
        <MapContext.Provider value={map}>
          <Routes>
            <Route element={<NewLeg patrol={patrol} />} path="/patrols/:patrolId/legs/new" />

            <Route element={null} path="/patrols/*" />
          </Routes>
        </MapContext.Provider>

        <LocationDisplay />
      </Provider>,
      { initialEntries: [`/patrols/${patrol.id}/legs/new`] }
    );

    return { ...renderResult, user };
  };

  const clickSave = (user) => user.click(screen.getByRole('button', { name: 'Save' }));

  const getDateInput = (groupName, inputName) =>
    within(screen.getByRole('group', { name: groupName })).getByRole('textbox', { name: inputName });

  const getPathname = () => screen.getByTestId('test-location').textContent;

  const getStartDateTime = () => [
    getDateInput('Start date', 'Year').value,
    getDateInput('Start date', 'Month').value,
    getDateInput('Start date', 'Day').value,
    getDateInput('Start time', 'Hour').value,
    getDateInput('Start time', 'Minute').value,
    getDateInput('Start time', 'Time period').value,
  ].join(' ');

  test('shows the three parts of the leg form', () => {
    renderNewLeg();

    expect(screen.getByRole('group', { name: 'Start Time' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Objective' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Patrol Type' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toBeVisible();
  });

  test('names the patrol the leg belongs to in its breadcrumb', () => {
    renderNewLeg();

    expect(screen.getByRole('link', { name: 'Delta Patrol' })).toHaveAttribute('href', `/patrols/${patrol.id}`);
  });

  describe('prefilling the form with the previous leg', () => {
    test('takes its patrol type', () => {
      renderNewLeg();

      expect(screen.getByText(dogPatrol.display)).toBeVisible();
    });

    test('takes its team lead', () => {
      renderNewLeg();

      expect(screen.getByText('Alex')).toBeVisible();
    });

    test('starts the leg where the previous one ends', () => {
      renderNewLeg();

      expect(getStartDateTime()).toBe('2026 04 13 10 00 AM');
    });

    test('starts the leg now when the previous one carries no end', () => {
      patrol.patrol_segments[0].scheduled_end = null;

      renderNewLeg();

      expect(getStartDateTime()).toBe('2026 04 13 12 00 PM');
    });

    test('starts the leg where the previous one does when that one is planned ahead of time', () => {
      patrol.patrol_segments[0].scheduled_end = null;
      patrol.patrol_segments[0].scheduled_start = new Date(2026, 3, 15, 7, 30).toISOString();
      patrol.patrol_segments[0].time_range = { end_time: null, start_time: null };

      renderNewLeg();

      expect(getStartDateTime()).toBe('2026 04 15 07 30 AM');
    });

    test('starts the leg on the minute after an end carrying seconds', () => {
      patrol.patrol_segments[0].scheduled_end = new Date(2026, 3, 13, 10, 0, 32).toISOString();

      renderNewLeg();

      expect(getStartDateTime()).toBe('2026 04 13 10 01 AM');
    });

    test('leaves the end and the locations of the leg empty', () => {
      renderNewLeg();

      expect(getDateInput('End date', 'Year')).toHaveValue('');
      expect(screen.getByLabelText('Start Location')).toHaveValue('');
      expect(screen.getByLabelText('End Location')).toHaveValue('');
    });
  });

  describe('saving', () => {
    test('adds the leg to the patrol and goes back to its overview', async () => {
      const { user } = renderNewLeg();

      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      const [patrolUpdate] = updatePatrol.mock.calls[0];

      expect(patrolUpdate.id).toBe(patrol.id);
      expect(patrolUpdate.patrol_segments).toHaveLength(2);
      expect(patrolUpdate.patrol_segments[0].id).toBe(patrol.patrol_segments[0].id);
      expect(patrolUpdate.patrol_segments[0].time_range.end_time)
        .toBe(new Date(2026, 3, 13, 10, 0).toISOString());
      expect(patrolUpdate.patrol_segments[1].patrol_type).toBe(dogPatrol.value);
      expect(patrolUpdate.patrol_segments[1].leader).toBe(teamLead);
      expect(patrolUpdate.patrol_segments[1].time_range.start_time)
        .toBe(new Date(2026, 3, 13, 10, 0).toISOString());

      await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}`));
    });

    test('associates the save button with the leg form', () => {
      const { container } = renderNewLeg();

      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(saveButton).toHaveAttribute('type', 'submit');
      expect(saveButton.form).toBe(container.querySelector('form'));
    });

    test('does not add the leg when its start time is incomplete', async () => {
      const { user } = renderNewLeg();

      await user.clear(getDateInput('Start time', 'Hour'));
      await clickSave(user);

      expect(updatePatrol).not.toHaveBeenCalled();
      expect(screen.getByText('A leg needs a start time.')).toBeVisible();
      expect(screen.getByRole('group', { name: 'Start time' })).toHaveAttribute('aria-invalid', 'true');
    });

    test('does not add the leg when a start typed on another day lands before the previous end', async () => {
      const { user } = renderNewLeg();

      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '20');
      await user.clear(getDateInput('Start time', 'Hour'));
      await user.type(getDateInput('Start time', 'Hour'), '08');
      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '13');

      await clickSave(user);

      expect(updatePatrol).not.toHaveBeenCalled();
      expect(screen.getByText('This leg cannot overlap the previous one.')).toBeVisible();
      expect(screen.getByRole('group', { name: 'Start date' })).toHaveAttribute('aria-invalid', 'true');
    });

    test('ends the previous leg where the new one begins when it carries no end', async () => {
      patrol.patrol_segments[0].scheduled_end = null;

      const { user } = renderNewLeg();

      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      const [patrolUpdate] = updatePatrol.mock.calls[0];

      expect(patrolUpdate.patrol_segments[0].time_range.end_time)
        .toBe(new Date(2026, 3, 13, 12, 0).toISOString());
      expect(patrolUpdate.patrol_segments[1].time_range.start_time)
        .toBe(new Date(2026, 3, 13, 12, 0).toISOString());
    });

    test('leaves the previous leg alone when it never started', async () => {
      patrol.patrol_segments[0].time_range = { end_time: null, start_time: null };
      patrol.patrol_segments[0].scheduled_end = null;

      const { user } = renderNewLeg();

      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      const [patrolUpdate] = updatePatrol.mock.calls[0];

      expect(patrolUpdate.patrol_segments[0]).toBe(patrol.patrol_segments[0]);
    });

    test('shows an error message when the leg cannot be added', async () => {
      updatePatrol.mockImplementation(() => () => Promise.reject(new Error('Oops')));
      jest.spyOn(toast, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { user } = renderNewLeg();

      await clickSave(user);

      await waitFor(
        () => expect(toast.error).toHaveBeenCalledWith('The patrol leg could not be created. Please try again.')
      );
      expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}/legs/new`);
    });
  });

  test('sends the user back to the patrol overview when the patrol runs from the mobile app', async () => {
    patrol.provenance = 'mobile';

    renderNewLeg();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  test.each(['cancelled', 'done'])('sends the user back to the patrol overview when the patrol is %s', async (state) => {
    patrol.state = state;

    renderNewLeg();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  test('sends the user back to the patrol overview when the last leg of the patrol has ended', async () => {
    patrol.patrol_segments[0].time_range.end_time = new Date(2026, 3, 13, 10, 0).toISOString();

    renderNewLeg();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  test('sends the user back to the patrol overview when they may not update patrols', async () => {
    store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];

    renderNewLeg();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent(`/patrols/${patrol.id}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  describe('remembering whether a leg starts and ends by itself', () => {
    test('stores the choice of starting by itself', async () => {
      patrol.patrol_segments[0].scheduled_end = new Date(2026, 3, 13, 14, 0).toISOString();

      const { user } = renderNewLeg();

      await user.click(screen.getByRole('checkbox', { name: 'Automatically start the leg at this time' }));

      expect(updateUserPreferences).toHaveBeenCalledWith({ autoStartPatrols: true });
    });

    test('stores the choice of ending by itself', async () => {
      const { user } = renderNewLeg();

      await user.type(getDateInput('End date', 'Year'), '2026');
      await user.type(getDateInput('End date', 'Month'), '04');
      await user.type(getDateInput('End date', 'Day'), '20');
      await user.type(getDateInput('End time', 'Hour'), '08');
      await user.type(getDateInput('End time', 'Minute'), '00');
      await user.click(screen.getByRole('checkbox', { name: 'Automatically end the leg at this time' }));

      expect(updateUserPreferences).toHaveBeenCalledWith({ autoEndPatrols: true });
    });

    test('opens the form with the choices the user made last', () => {
      patrol.patrol_segments[0].scheduled_end = new Date(2026, 3, 13, 14, 0).toISOString();
      store.view.userPreferences.autoStartPatrols = true;

      renderNewLeg();

      expect(screen.getByRole('checkbox', { name: 'Automatically start the leg at this time' })).toBeChecked();
    });
  });

  describe('leaving the form', () => {
    const withDefaultObjective = {
      ...defaultPatrolSegmentTypeSchema,
      json: {
        ...defaultPatrolSegmentTypeSchema.json,
        properties: {
          ...defaultPatrolSegmentTypeSchema.json.properties,
          objective: { ...defaultPatrolSegmentTypeSchema.json.properties.objective, default: 'Routine sweep' },
        },
      },
    };

    test('goes back to the patrol overview from a form the user has not touched', async () => {
      const { user } = renderNewLeg();

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe(`/patrols/${patrol.id}`);
    });

    test('goes back without warning when the schema filled fields in by itself', async () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { isLoading: false, schema: withDefaultObjective };

      const { user } = renderNewLeg();

      expect(screen.getByRole('textbox', { name: 'Objective' })).toHaveValue('Routine sweep');

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe(`/patrols/${patrol.id}`);
    });

    test('warns about unsaved changes once the user edits a schema filled field', async () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { isLoading: false, schema: withDefaultObjective };

      const { user } = renderNewLeg();

      await user.type(screen.getByRole('textbox', { name: 'Objective' }), ' and count');
      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/new`);
    });

    test('warns about unsaved changes when the user edits the form', async () => {
      const { user } = renderNewLeg();

      await user.type(screen.getByRole('textbox', { name: 'Objective' }), 'Count the herd');
      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/new`);
    });

    test('does not warn about unsaved changes while the leg is being saved', async () => {
      updatePatrol.mockImplementation(() => () => new Promise(() => {}));

      const { user } = renderNewLeg();

      await user.type(screen.getByRole('textbox', { name: 'Objective' }), 'Count the herd');
      await clickSave(user);

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe(`/patrols/${patrol.id}`);
    });
  });
});
