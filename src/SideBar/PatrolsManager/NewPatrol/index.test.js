import React from 'react';
import { Provider } from 'react-redux';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../../__test-helpers/mocks';
import { createPatrol } from '../../../ducks/patrols';
import { DEFAULT_PATROL_SEGMENT_TYPE } from '../../../ducks/patrol-schemas';
import { defaultPatrolSegmentTypeSchema, patrolTypeFieldsSchema } from '../../../__test-helpers/fixtures/patrol-schemas';
import { fetchPatrolTypes } from '../../../ducks/patrol-types';
import { GPS_FORMATS } from '../../../utils/location';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes, { dogPatrol, routinePatrol } from '../../../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS } from '../../../constants';
import { render, screen, waitFor, within } from '../../../test-utils';

import NewPatrol from './';

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  createPatrol: jest.fn(),
}));

jest.mock('../../../ducks/patrol-types', () => ({
  ...jest.requireActual('../../../ducks/patrol-types'),
  fetchPatrolTypes: jest.fn(),
}));

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

const NewPatrolNavigation = () => {
  const navigate = useNavigate();

  const onClick = () => navigate(
    { pathname: '/patrols/new', search: `?patrol-type=${routinePatrol.id}` },
    { state: { temporalId: 'another-temporal-id' } }
  );

  return <button onClick={onClick} type="button">Add another patrol</button>;
};

describe('SideBar - PatrolsManager - NewPatrol', () => {
  let map, store;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-13T12:00:00.000Z'));

    createPatrol.mockImplementation(
      () => () => Promise.resolve({ data: { data: { id: 'a-new-patrol-id' } } })
    );
    fetchPatrolTypes.mockImplementation(() => () => Promise.resolve());

    map = createMapMock();

    store = {
      data: {
        patrolSchemas: {
          [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: defaultPatrolSegmentTypeSchema },
          [dogPatrol.value]: { isLoading: false, schema: patrolTypeFieldsSchema },
          [routinePatrol.value]: { isLoading: false, schema: patrolTypeFieldsSchema },
        },
        patrolTeamAndTrackingOptions: { assets: [], leaders: [], teamMembers: [], teams: [] },
        patrolTypes,
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.CREATE, PERMISSIONS.READ] } },
        userContent: {},
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        mapLocationSelection: { isPickingLocation: false },
        modals: { canShowModals: true },
        showUserLocation: false,
        userLocation: null,
        userPreferences: {
          autoEndPatrols: false,
          autoStartPatrols: false,
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderNewPatrol = ({ patrolTypeId = dogPatrol.id } = {}) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const renderResult = render(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <Routes>
            <Route element={<NewPatrol />} path="/patrols/new" />

            <Route element={null} path="/patrols/*" />
          </Routes>
        </MapContext.Provider>

        <LocationDisplay />

        <NewPatrolNavigation />
      </Provider>,
      { initialEntries: [`/patrols/new?patrol-type=${patrolTypeId}`] }
    );

    return { ...renderResult, user };
  };

  const clickSave = (user) => user.click(screen.getByRole('button', { name: 'Save' }));

  const getStartDateInput = (name) =>
    within(screen.getByRole('group', { name: 'Start date' })).getByRole('textbox', { name });

  const pickRoutinePatrolType = async (user) => {
    await user.type(screen.getByRole('combobox', { name: 'Patrol Type' }), '{arrowdown}');
    await user.click(screen.getByRole('option', { name: routinePatrol.display }));
  };

  test('shows the three parts of the leg form', () => {
    renderNewPatrol();

    expect(screen.getByRole('group', { name: 'Start Time' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Objective' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Patrol Type' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toBeVisible();
  });

  test('titles the patrol after its patrol type', () => {
    renderNewPatrol();

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveValue('Dog Patrol');
  });

  test('starts a brand new patrol when the route is reached again for another type', async () => {
    const { user } = renderNewPatrol();

    await user.click(screen.getByRole('button', { name: 'Add another patrol' }));

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveValue('Routine Patrol');
  });

  test('retitles the patrol when the user picks another patrol type', async () => {
    const { user } = renderNewPatrol();

    await pickRoutinePatrolType(user);

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveValue('Routine Patrol');
  });

  test('keeps the title the user wrote when they pick another patrol type', async () => {
    const { user } = renderNewPatrol();

    await user.type(screen.getByRole('textbox', { name: 'Patrol title' }), ' North');

    await pickRoutinePatrolType(user);

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveValue('Dog Patrol North');
  });

  test('shows the title as unsaved once the user edits it', async () => {
    const { user } = renderNewPatrol();

    const titleInput = screen.getByRole('textbox', { name: 'Patrol title' });

    expect(titleInput).not.toHaveClass('unsaved');

    await user.type(titleInput, ' North');

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveClass('unsaved');
  });

  test('starts the patrol at the current date and time', () => {
    renderNewPatrol();

    expect(getStartDateInput('Year')).toHaveValue('2026');
    expect(getStartDateInput('Month')).toHaveValue('04');
    expect(getStartDateInput('Day')).toHaveValue('13');
  });

  test('shows the loader while the patrol types are on their way', () => {
    store.data.patrolTypes = [];
    fetchPatrolTypes.mockImplementation(() => () => new Promise(() => {}));

    renderNewPatrol();

    expect(screen.getByTestId('newPatrol-loader')).toBeVisible();
  });

  test('fetches the patrol types when the store holds none', async () => {
    store.data.patrolTypes = [];

    renderNewPatrol();

    await waitFor(() => expect(fetchPatrolTypes).toHaveBeenCalled());
  });

  test('does not fetch the patrol types when the store already holds them', () => {
    renderNewPatrol();

    expect(fetchPatrolTypes).not.toHaveBeenCalled();
  });

  test('redirects to the patrols feed when the patrol type is unknown', async () => {
    renderNewPatrol({ patrolTypeId: 'not-a-patrol-type' });

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
  });

  test('redirects to the patrols feed when the patrol types cannot be loaded', async () => {
    store.data.patrolTypes = [];
    fetchPatrolTypes.mockImplementation(() => () => Promise.reject(new Error('Server error')));

    renderNewPatrol();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
  });

  test('redirects to the patrols feed when the user may not create patrols', async () => {
    store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];

    renderNewPatrol();

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
    expect(screen.queryByRole('group', { name: 'Start Time' })).toBeNull();
  });

  describe('saving', () => {
    test('creates the patrol and goes to its overview', async () => {
      const { user } = renderNewPatrol();

      await clickSave(user);

      await waitFor(() => expect(createPatrol).toHaveBeenCalledTimes(1));

      const [createdPatrol] = createPatrol.mock.calls[0];

      expect(createdPatrol.icon_id).toBe(dogPatrol.icon_id);
      expect(createdPatrol.is_collection).toBe(false);
      expect(createdPatrol.title).toBe('Dog Patrol');
      expect(createdPatrol.patrol_segments).toHaveLength(1);
      expect(createdPatrol.patrol_segments[0].patrol_type).toBe(dogPatrol.value);
      expect(createdPatrol.patrol_segments[0].time_range.start_time).not.toBeNull();

      await waitFor(
        () => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols/a-new-patrol-id')
      );
    });

    test('creates the patrol with the patrol type the user picked', async () => {
      const { user } = renderNewPatrol();

      await pickRoutinePatrolType(user);

      await clickSave(user);

      await waitFor(() => expect(createPatrol).toHaveBeenCalledTimes(1));

      const [createdPatrol] = createPatrol.mock.calls[0];

      expect(createdPatrol.icon_id).toBe(routinePatrol.icon_id);
      expect(createdPatrol.title).toBe('Routine Patrol');
      expect(createdPatrol.patrol_segments[0].patrol_type).toBe(routinePatrol.value);
    });

    test('associates the save button with the leg form', () => {
      const { container } = renderNewPatrol();

      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(saveButton).toHaveAttribute('type', 'submit');
      expect(saveButton.form).toBe(container.querySelector('form'));
    });

    test('does not create the patrol when the start date is empty', async () => {
      const { user } = renderNewPatrol();

      await user.clear(getStartDateInput('Year'));

      await clickSave(user);

      expect(createPatrol).not.toHaveBeenCalled();
      expect(screen.getByText('A leg needs a start date.')).toBeVisible();
    });

    test('shows an error message when the patrol cannot be created', async () => {
      createPatrol.mockImplementation(() => () => Promise.reject(new Error('Oops')));
      jest.spyOn(toast, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { user } = renderNewPatrol();

      await clickSave(user);

      await waitFor(
        () => expect(toast.error).toHaveBeenCalledWith('The patrol could not be created. Please try again.')
      );
      expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols/new');
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

    const getPathname = () => screen.getByTestId('test-location').textContent;

    test('goes back to the patrols feed from a form the user has not touched', async () => {
      const { user } = renderNewPatrol();

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe('/patrols');
    });

    test('goes back without warning when the schema filled fields in by itself', async () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { isLoading: false, schema: withDefaultObjective };

      const { user } = renderNewPatrol();

      expect(screen.getByRole('textbox', { name: 'Objective' })).toHaveValue('Routine sweep');

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe('/patrols');
    });

    test('warns about unsaved changes once the user edits a schema filled field', async () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { isLoading: false, schema: withDefaultObjective };

      const { user } = renderNewPatrol();

      await user.type(screen.getByRole('textbox', { name: 'Objective' }), ' and count');
      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(getPathname()).toBe('/patrols/new');
    });

    test('does not warn about unsaved changes while the patrol is being created', async () => {
      createPatrol.mockImplementation(() => () => new Promise(() => {}));

      const { user } = renderNewPatrol();

      await user.type(screen.getByRole('textbox', { name: 'Objective' }), 'Count the herd');
      await clickSave(user);

      await user.click(screen.getByRole('link', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(getPathname()).toBe('/patrols');
    });
  });
});
