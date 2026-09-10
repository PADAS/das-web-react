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

import EditLeg from './';

jest.mock('../../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

describe('SideBar - PatrolsManager - LegManager - EditLeg', () => {
  const teamLead = { id: 'leader-1', name: 'Alex' };
  const teamMember = { id: 'member-1', name: 'Nadia' };
  const asset = { id: 'asset-1', name: 'Land Cruiser' };
  const team = { display: 'Alpha', id: 'team-1' };

  const firstLegId = '76794b2f-cbb2-49ed-b0dd-9335ae471562';
  const lastLegId = '5e2f6a55-4e4a-4b8e-9d84-2a1b6a4d1f90';

  let map, patrol, store;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date(2026, 3, 13, 12, 0));

    updatePatrol.mockImplementation(() => () => Promise.resolve());

    map = createMapMock();

    patrol = {
      id: '93485e1d-6804-459b-9243-1d239556bb48',
      patrol_segments: [{
        assets: [asset.id],
        end_location: { latitude: 2, longitude: 3 },
        id: firstLegId,
        leader: teamLead,
        members: [teamLead.id, teamMember.id],
        patrol_type: dogPatrol.value,
        scheduled_end: null,
        scheduled_start: null,
        segment_details: { objective: 'Sweep the fence line' },
        start_location: { latitude: 0, longitude: 1 },
        team: team.id,
        time_range: {
          end_time: new Date(2026, 3, 13, 10, 0).toISOString(),
          start_time: new Date(2026, 3, 13, 6, 0).toISOString(),
        },
        type_details: { vehicle_name: 'KTN-123' },
      }, {
        assets: [],
        end_location: null,
        id: lastLegId,
        leader: null,
        members: [],
        patrol_type: routinePatrol.value,
        scheduled_end: null,
        scheduled_start: null,
        segment_details: {},
        start_location: null,
        team: null,
        time_range: { end_time: null, start_time: new Date(2026, 3, 13, 10, 0).toISOString() },
        type_details: {},
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
        patrolStore: { [patrol.id]: patrol },
        patrolTeamAndTrackingOptions: {
          assets: [asset],
          leaders: [teamLead],
          members: [teamLead, teamMember],
          teams: [team],
        },
        patrolTypes,
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE] } },
        userContent: {},
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        mapLocationSelection: { isPickingLocation: false },
        modals: { canShowModals: true },
        patrolTrackState: { pinned: [], visible: [] },
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

  const renderEditLeg = (legId = firstLegId) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const renderResult = render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <Routes>
            <Route element={<EditLeg patrol={patrol} />} path="/patrols/:patrolId/legs/:legId/edit" />

            <Route element={null} path="/patrols/*" />
          </Routes>
        </MapContext.Provider>

        <LocationDisplay />
      </Provider>,
      { initialEntries: [`/patrols/${patrol.id}/legs/${legId}/edit`] }
    );

    return { ...renderResult, user };
  };

  const clickSave = (user) => user.click(screen.getByRole('button', { name: 'Save' }));

  const editObjective = (user, text) => user.type(screen.getByRole('textbox', { name: 'Objective' }), text);

  const getDateInput = (groupName, inputName) =>
    within(screen.getByRole('group', { name: groupName })).getByRole('textbox', { name: inputName });

  const getPathname = () => screen.getByTestId('test-location').textContent;

  const readTeamAndTrackingField = (label) => within(screen.getByText(label).parentElement);

  describe('prefilling the form with the leg being edited', () => {
    test('takes its start and its end', () => {
      renderEditLeg();

      expect(getDateInput('Start date', 'Day')).toHaveValue('13');
      expect(getDateInput('Start time', 'Hour')).toHaveValue('06');
      expect(getDateInput('End date', 'Day')).toHaveValue('13');
      expect(getDateInput('End time', 'Hour')).toHaveValue('10');
    });

    test('takes its locations', () => {
      renderEditLeg();

      expect(screen.getByLabelText('Start Location')).toHaveValue('0.000000°, 1.000000°');
      expect(screen.getByLabelText('End Location')).toHaveValue('2.000000°, 3.000000°');
    });

    test('takes its patrol type', () => {
      renderEditLeg();

      expect(screen.getByText(dogPatrol.display)).toBeVisible();
    });

    test('takes its team, its lead, its members and its assets', () => {
      renderEditLeg();

      expect(readTeamAndTrackingField('Team').getByText(team.display)).toBeVisible();
      expect(readTeamAndTrackingField('Team Lead').getByText(teamLead.name)).toBeVisible();
      expect(readTeamAndTrackingField('Team Members').getByText(teamMember.name)).toBeVisible();
      expect(readTeamAndTrackingField('Assets').getByText(asset.name)).toBeVisible();
    });

    test('takes the values of its universal and patrol type fields', () => {
      renderEditLeg();

      expect(screen.getByRole('textbox', { name: 'Objective' })).toHaveValue('Sweep the fence line');
      expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toHaveValue('KTN-123');
    });

    test('titles the view after the leg and names the patrol it belongs to in its breadcrumb', () => {
      renderEditLeg();

      expect(screen.getByRole('heading', { name: 'Edit Leg 1' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'Delta Patrol' })).toHaveAttribute('href', `/patrols/${patrol.id}`);
    });
  });

  describe('the room the legs around it leave it', () => {
    test('offers no end time later than the start of the leg after it', async () => {
      const { user } = renderEditLeg();

      const endTime = screen.getByRole('group', { name: 'End time' });
      await user.click(within(endTime).getByLabelText('Open time options'));

      expect(within(endTime).getAllByRole('option')).toHaveLength(17);
    });

    test('offers no start time earlier than the end of the leg before it', async () => {
      const { user } = renderEditLeg(lastLegId);

      const startTime = screen.getByRole('group', { name: 'Start time' });
      await user.click(within(startTime).getByLabelText('Open time options'));

      expect(within(startTime).getAllByRole('option')).toHaveLength(56);
    });

    test('does not save a start typed on another day that lands before the leg before it', async () => {
      const { user } = renderEditLeg(lastLegId);

      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '20');
      await user.clear(getDateInput('Start time', 'Hour'));
      await user.type(getDateInput('Start time', 'Hour'), '08');
      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '13');

      await clickSave(user);

      expect(updatePatrol).not.toHaveBeenCalled();
      expect(screen.getByText('This leg cannot overlap the previous one.')).toBeVisible();
    });

    test('does not save a start typed on another day that lands after the leg after it', async () => {
      const { user } = renderEditLeg();

      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '10');
      await user.clear(getDateInput('Start time', 'Hour'));
      await user.type(getDateInput('Start time', 'Hour'), '11');
      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '13');

      await clickSave(user);

      expect(updatePatrol).not.toHaveBeenCalled();
      expect(screen.getByText('This leg cannot overlap the next one.')).toBeVisible();
    });

    test('saves the leg a pause left on the same instant as the leg before it', async () => {
      const pausedAt = new Date(2026, 3, 13, 10, 0, 47, 512).toISOString();
      patrol.patrol_segments[0].time_range.end_time = pausedAt;
      patrol.patrol_segments[1].time_range.start_time = pausedAt;

      const { user } = renderEditLeg(lastLegId);

      await editObjective(user, 'Count the herd');
      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      expect(updatePatrol.mock.calls[0][0].patrol_segments).toEqual([{
        id: lastLegId,
        segment_details: { objective: 'Count the herd' },
      }]);
    });

    test('saves a pause leg the legs on both sides of it stamped to the second', async () => {
      const pausedAt = new Date(2026, 3, 13, 10, 0, 47, 512).toISOString();
      const resumedAt = new Date(2026, 3, 13, 11, 30, 22, 908).toISOString();
      const pauseLegId = 'aaaaaaaa-0000-0000-0000-000000000001';

      patrol.patrol_segments[0].time_range.end_time = pausedAt;
      patrol.patrol_segments[1].time_range.start_time = resumedAt;
      patrol.patrol_segments.splice(1, 0, {
        ...patrol.patrol_segments[0],
        id: pauseLegId,
        is_pause: true,
        segment_details: { objective: 'Paused for the storm' },
        time_range: { end_time: resumedAt, start_time: pausedAt },
      });

      const { user } = renderEditLeg(pauseLegId);

      await editObjective(user, ' again');
      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      expect(updatePatrol.mock.calls[0][0].patrol_segments).toEqual([{
        id: pauseLegId,
        segment_details: { objective: 'Paused for the storm again' },
      }]);
    });

    test('saves a leg that already outlives the leg after it', async () => {
      patrol.patrol_segments[0].time_range.end_time = new Date(2026, 3, 13, 14, 0).toISOString();

      const { user } = renderEditLeg();

      await editObjective(user, ' twice');
      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      expect(updatePatrol.mock.calls[0][0].patrol_segments).toEqual([{
        id: firstLegId,
        segment_details: { objective: 'Sweep the fence line twice' },
      }]);
    });

    test('gives back the seconds of a time the user left alone when retiming the other one', async () => {
      const startedAt = new Date(2026, 3, 13, 6, 0, 47, 512).toISOString();
      patrol.patrol_segments[0].time_range.start_time = startedAt;

      const { user } = renderEditLeg();

      await user.clear(getDateInput('End time', 'Hour'));
      await user.type(getDateInput('End time', 'Hour'), '09');

      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      expect(updatePatrol.mock.calls[0][0].patrol_segments).toEqual([{
        id: firstLegId,
        time_range: { end_time: new Date(2026, 3, 13, 9, 0).toISOString(), start_time: startedAt },
      }]);
    });

    test('drops the overlap message once the user corrects the start time it points at', async () => {
      const { user } = renderEditLeg();

      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '10');
      await user.clear(getDateInput('Start time', 'Hour'));
      await user.type(getDateInput('Start time', 'Hour'), '11');
      await user.clear(getDateInput('Start date', 'Day'));
      await user.type(getDateInput('Start date', 'Day'), '13');

      await clickSave(user);

      await user.clear(getDateInput('Start time', 'Hour'));
      await user.type(getDateInput('Start time', 'Hour'), '07');

      expect(screen.queryByText('This leg cannot overlap the next one.')).toBeNull();
    });
  });

  describe('saving', () => {
    test('updates the edited leg alone and goes back to its overview', async () => {
      const { user } = renderEditLeg();

      await user.clear(screen.getByRole('textbox', { name: 'Objective' }));
      await editObjective(user, 'Count the herd');
      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      const [patrolUpdate] = updatePatrol.mock.calls[0];

      expect(patrolUpdate.id).toBe(patrol.id);
      expect(patrolUpdate.patrol_segments).toEqual([{
        id: firstLegId,
        segment_details: { objective: 'Count the herd' },
      }]);

      await waitFor(() => expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/${firstLegId}`));
    });

    test('leaves the start a leg was only ever scheduled for as a plan', async () => {
      patrol.patrol_segments = [{
        ...patrol.patrol_segments[0],
        scheduled_start: new Date(2026, 3, 13, 8, 0).toISOString(),
        time_range: { end_time: null, start_time: null },
      }];

      const { user } = renderEditLeg();

      await editObjective(user, ' twice');
      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      expect(updatePatrol.mock.calls[0][0].patrol_segments).toEqual([{
        id: firstLegId,
        segment_details: { objective: 'Sweep the fence line twice' },
      }]);
    });

    test('sends the times of a leg the user retimed, and nothing else', async () => {
      const { user } = renderEditLeg(lastLegId);

      await user.clear(getDateInput('Start time', 'Hour'));
      await user.type(getDateInput('Start time', 'Hour'), '11');

      await clickSave(user);

      await waitFor(() => expect(updatePatrol).toHaveBeenCalledTimes(1));

      expect(updatePatrol.mock.calls[0][0].patrol_segments).toEqual([{
        id: lastLegId,
        time_range: { end_time: null, start_time: new Date(2026, 3, 13, 11, 0).toISOString() },
      }]);
    });

    test('associates the save button with the leg form', () => {
      const { container } = renderEditLeg();

      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(saveButton).toHaveAttribute('type', 'submit');
      expect(saveButton.form).toBe(container.querySelector('form'));
    });

    test('leaves the save button disabled until the leg carries a change to save', async () => {
      const { user } = renderEditLeg();

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      await editObjective(user, ' twice');

      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    test('shows an error message when the leg cannot be saved', async () => {
      updatePatrol.mockImplementation(() => () => Promise.reject(new Error('Oops')));
      jest.spyOn(toast, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { user } = renderEditLeg();

      await editObjective(user, ' twice');
      await clickSave(user);

      await waitFor(
        () => expect(toast.error).toHaveBeenCalledWith('The patrol leg could not be saved. Please try again.')
      );
      expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/${firstLegId}/edit`);
    });
  });

  describe('leaving the form', () => {
    test('goes back to the leg overview from a form the user has not touched', async () => {
      const { user } = renderEditLeg();

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/${firstLegId}`);
    });

    test('warns about unsaved changes when the user edits the form', async () => {
      const { user } = renderEditLeg();

      await editObjective(user, ' twice');
      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/${firstLegId}/edit`);
    });
  });

  test('sends the user back to the patrol overview when the leg it is asked for is gone', async () => {
    renderEditLeg('c9c1c8a4-3a29-4a19-9a2f-27a1b09e4b52');

    await waitFor(() => expect(getPathname()).toBe(`/patrols/${patrol.id}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  test('sends the user back to the leg overview when they may not update patrols', async () => {
    store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];

    renderEditLeg();

    await waitFor(() => expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/${firstLegId}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  test('sends the user back to the leg overview when the leg still runs from the mobile app', async () => {
    patrol.provenance = 'mobile';

    renderEditLeg(lastLegId);

    await waitFor(() => expect(getPathname()).toBe(`/patrols/${patrol.id}/legs/${lastLegId}`));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });
});
