import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../__test-helpers/mocks';
import { GPS_FORMATS } from '../../utils/location';
import { MapContext } from '../../App';
import MapDrawingToolsContextProvider from '../../MapDrawingTools/ContextProvider';
import { newPatrol, overduePatrol,  patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';

import PlanSection from '.';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/patrols' }),
}));

jest.mock('../../ducks/patrols', () => ({
  ...jest.requireActual('../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const onPatrolEndDateChange = jest.fn(),
  onPatrolEndLocationChange = jest.fn(),
  onPatrolObjectiveChange = jest.fn(),
  onPatrolReportedByChange = jest.fn(),
  onPatrolStartDateChange = jest.fn(),
  onPatrolStartLocationChange = jest.fn();
const store = {
  ...patrolDefaultStoreData,
  view: {
    ...patrolDefaultStoreData.view,
    mapLocationSelection: { isPickingLocation: false },
    userPreferences: { gpsFormat: GPS_FORMATS.DEG },
  },
};
store.data.patrolLeaderSchema.trackedbySchema.properties.leader.enum_ext.push(
  {
    value: {
      content_type: 'observations.subject',
      id: 'dba0e0a6-0083-41be-a0eb-99e956977748',
      name: 'Alex',
      subject_type: 'person',
      subject_subtype: 'ranger',
      common_name: null,
      additional: {},
      created_at: '2021-08-31T14:42:06.701541-07:00',
      updated_at: '2021-08-31T14:42:06.701557-07:00',
      is_active: true,
      tracks_available: false,
      image_url: '/static/ranger-black.svg'
    },
  }
);

describe('PatrolDetailView - PlanSection', () => {
  let map, mockedStore;
  beforeEach(() => {
    map = createMapMock();
  });

  const renderPlanSectionWithWrapper = (overwriteProps) => {
    mockedStore = mockStore(store);
    render(
      <Provider store={mockedStore}>
        <MapContext.Provider value={map}>
          <MapDrawingToolsContextProvider>
            <PlanSection
              onPatrolEndDateChange={onPatrolEndDateChange}
              onPatrolEndLocationChange={onPatrolEndLocationChange}
              onPatrolObjectiveChange={onPatrolObjectiveChange}
              onPatrolReportedByChange={onPatrolReportedByChange}
              onPatrolStartDateChange={onPatrolStartDateChange}
              onPatrolStartLocationChange={onPatrolStartLocationChange}
              patrolForm={newPatrol}
              {...overwriteProps}
            />
          </MapDrawingToolsContextProvider>
        </MapContext.Provider>
      </Provider>
    );
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the name of the tracking subject for patrols that already exist', async () => {
    renderPlanSectionWithWrapper({ patrolForm: overduePatrol });

    const reportedBySelect = await screen.getByTestId('patrolDetailView-reportedBySelect');
    const selectionImage = await screen.getByAltText('Radio icon for Alex value');

    expect(within(reportedBySelect).queryByText('Select Device...')).toBeNull();
    expect(selectionImage).toHaveAttribute('src', 'https://localhost//static/ranger-black.svg');
    expect((await within(reportedBySelect).findByText('Alex'))).toBeDefined();
  });

  test('it should show the field empty for new patrols', async () => {
    renderPlanSectionWithWrapper();

    const reportedBySelect = await screen.getByTestId('patrolDetailView-reportedBySelect');
    const placeholderText = within(reportedBySelect).queryByText('Select Device...');

    expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
    expect(placeholderText).toBeDefined();
  });

  test('triggers the onPatrolReportedByChange callback when the user selects a subject', async () => {
    renderPlanSectionWithWrapper();

    const selectReportedBy = await screen.getByText('Select Device...');
    userEvent.click(selectReportedBy);

    expect(onPatrolReportedByChange).toHaveBeenCalledTimes(0);

    const reporterOption = await screen.getByAltText('Radio icon for Alex option');
    userEvent.click(reporterOption);

    expect(onPatrolReportedByChange).toHaveBeenCalledTimes(1);
    expect(onPatrolReportedByChange.mock.calls[0][0].id).toBe('dba0e0a6-0083-41be-a0eb-99e956977748');
  });

  test('it should show the objective for patrols that already exist', async () => {
    renderPlanSectionWithWrapper({ patrolForm: overduePatrol });

    const objectiveInput = await screen.getByTestId('patrolDetailView-objectiveTextArea');

    expect(objectiveInput).toHaveTextContent('very ambitious objective');
  });

  test('triggers the onPatrolObjectiveChange callback when the user types an objective', async () => {
    renderPlanSectionWithWrapper();

    const objectiveInput = await screen.getByTestId('patrolDetailView-objectiveTextArea');
    userEvent.click(objectiveInput);

    expect(onPatrolObjectiveChange).toHaveBeenCalledTimes(0);

    userEvent.type(objectiveInput, 'Great objective');

    expect(onPatrolObjectiveChange).toHaveBeenCalled();
  });

  test('it should show the field empty for new patrols', async () => {
    renderPlanSectionWithWrapper();

    const objectiveInput = await screen.getByTestId('patrolDetailView-objectiveTextArea');

    expect(objectiveInput).toHaveTextContent('');
  });

  test('it should show the start and end location inputs', async () => {
    renderPlanSectionWithWrapper();

    expect(await screen.getByTestId('patrolDetailView-startLocationSelect')).toBeDefined();
    expect(await screen.getByTestId('patrolDetailView-endLocationSelect')).toBeDefined();
  });

  test('triggers the onPatrolStartDateChange callback', async () => {
    renderPlanSectionWithWrapper();

    expect(onPatrolStartDateChange).not.toHaveBeenCalled();

    const datePickerInput = (await screen.findAllByTestId('datePicker-input'))[0];
    userEvent.click(datePickerInput);
    const options = await screen.findAllByRole('option');
    userEvent.click(options[25]);

    expect(onPatrolStartDateChange).toHaveBeenCalledTimes(1);
  });

  test('triggers the onPatrolStartDateChange callback when user changes auto start value', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futurePatrol = {
      ...newPatrol,
      patrol_segments: [{
        ...newPatrol.patrol_segments[0],
        time_range: {
          ...newPatrol.patrol_segments[0].time_range,
          start_time: tomorrow,
        },
      }],
    };

    renderPlanSectionWithWrapper({ patrolForm: futurePatrol });

    expect(onPatrolStartDateChange).not.toHaveBeenCalled();

    const autoStartInput = (await screen.findAllByRole('checkbox'))[0];
    userEvent.click(autoStartInput);

    const actions = mockedStore.getActions();

    expect(onPatrolStartDateChange).toHaveBeenCalledTimes(1);
    expect(actions).toContainEqual({ payload: { autoStartPatrols: true }, type: 'UPDATE_USER_PREFERENCES' });
  });

  test('triggers the onPatrolEndDateChange callback', async () => {
    renderPlanSectionWithWrapper();

    expect(onPatrolEndDateChange).not.toHaveBeenCalled();

    const datePickerInput = (await screen.findAllByTestId('datePicker-input'))[1];
    userEvent.click(datePickerInput);
    const options = await screen.findAllByRole('option');
    userEvent.click(options[25]);

    expect(onPatrolEndDateChange).toHaveBeenCalledTimes(1);
  });

  test('triggers the onPatrolEndDateChange callback when user changes auto end value', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futurePatrol = {
      ...newPatrol,
      patrol_segments: [{
        ...newPatrol.patrol_segments[0],
        time_range: {
          ...newPatrol.patrol_segments[0].time_range,
          end_time: tomorrow,
        },
      }],
    };

    renderPlanSectionWithWrapper({ patrolForm: futurePatrol });

    expect(onPatrolEndDateChange).not.toHaveBeenCalled();

    const autoEndInput = (await screen.findAllByRole('checkbox'))[1];
    userEvent.click(autoEndInput);

    const actions = mockedStore.getActions();

    expect(onPatrolEndDateChange).toHaveBeenCalledTimes(1);
    expect(actions).toContainEqual({ payload: { autoEndPatrols: true }, type: 'UPDATE_USER_PREFERENCES' });
  });

  test('triggers the onPatrolStartLocationChange callback when the user chooses a location in map', async () => {
    renderPlanSectionWithWrapper();

    const setLocationButton = (await screen.findAllByTestId('set-location-button'))[0];
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    expect(onPatrolStartLocationChange).toHaveBeenCalledTimes(0);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect(onPatrolStartLocationChange).toHaveBeenCalledTimes(1);
    expect(onPatrolStartLocationChange).toHaveBeenCalledWith([88, 55]);
  });

  test('triggers the onPatrolEndLocationChange callback when the user chooses a location in map', async () => {
    renderPlanSectionWithWrapper();

    const setLocationButton = (await screen.findAllByTestId('set-location-button'))[1];
    userEvent.click(setLocationButton);
    const placeMarkerOnMapButton = await screen.findByTitle('Place marker on map');
    userEvent.click(placeMarkerOnMapButton);

    expect(onPatrolEndLocationChange).toHaveBeenCalledTimes(0);

    map.__test__.fireHandlers('click', { lngLat: { lng: 88, lat: 55 } });

    expect(onPatrolEndLocationChange).toHaveBeenCalledTimes(1);
    expect(onPatrolEndLocationChange).toHaveBeenCalledWith([88, 55]);
  });

  test('it should show the placeholder for empty values', async () => {
    renderPlanSectionWithWrapper();

    expect(await screen.findByText('Start Location')).toBeDefined();
    expect(await screen.findByText('End Location')).toBeDefined();
  });
});
