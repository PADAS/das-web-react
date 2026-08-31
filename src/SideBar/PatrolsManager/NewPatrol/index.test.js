import React from 'react';
import { Provider } from 'react-redux';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../../__test-helpers/mocks';
import { createPatrol } from '../../../ducks/patrols';
import { DEFAULT_PATROL_SEGMENT_TYPE } from '../../../ducks/patrol-schemas';
import { defaultPatrolSegmentTypeSchema, patrolTypeFieldsSchema } from '../../../__test-helpers/fixtures/patrol-schemas';
import { GPS_FORMATS } from '../../../utils/location';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes, { dogPatrol, routinePatrol } from '../../../__test-helpers/fixtures/patrol-types';
import { render, screen, waitFor, within } from '../../../test-utils';

import NewPatrol from './';

jest.mock('../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../ducks/patrols'),
  createPatrol: jest.fn(),
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

            {/* The routes the form leaves for are out of the scope of these tests. */}
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

  test('shows the loader while the patrol types are not in the store', () => {
    store.data.patrolTypes = [];
    renderNewPatrol();

    expect(screen.getByTestId('newPatrol-loader')).toBeVisible();
  });

  test('redirects to the patrols feed when the patrol type is unknown', async () => {
    renderNewPatrol({ patrolTypeId: 'not-a-patrol-type' });

    await waitFor(() => expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols'));
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

    // The save button lives in the footer, outside the form. It reaches the form through its form
    // attribute, which is also what lets a keyboard user submit by pressing enter in any field.
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
      expect(screen.getByText('A patrol needs a start date.')).toBeVisible();
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
});
